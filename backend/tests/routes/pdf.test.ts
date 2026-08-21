import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole, Priority, ProjectStatus, Severity, BugStatus } from "@prisma/client";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/auth/tokens.js";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.FRONTEND_ORIGIN = "http://localhost:5173";
});

beforeEach(() => {
  resetPrismaMock();
});

const app = createApp();

const fullProject = {
  id: "project-1",
  clientId: "client-1",
  name: "Storefront Revamp",
  description: "A rebuild.",
  priority: Priority.HIGH,
  status: ProjectStatus.ACTIVE,
  budget: 50000,
  startDate: new Date("2026-01-01"),
  endDate: null,
  createdByUserId: "pm-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: "client-1", name: "Northwind" },
  requiredSkills: [],
  assignments: [
    { developerId: "dev-profile-1", roleOnProject: "lead", developer: { user: { name: "Ada" } } }
  ],
  bugs: [
    { severity: Severity.HIGH, status: BugStatus.OPEN },
    { severity: Severity.CRITICAL, status: BugStatus.RESOLVED }
  ]
};

describe("GET /api/projects/:id/report.pdf", () => {
  it("streams a non-trivial PDF for a PM", async () => {
    prismaMock.project.findUnique.mockResolvedValue(fullProject as never);
    const pmToken = signAccessToken({ sub: "pm-1", email: "pm@example.com", role: UserRole.PROJECT_MANAGER });

    const res = await request(app)
      .get("/api/projects/project-1/report.pdf")
      .set("Authorization", `Bearer ${pmToken}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect((res.body as Buffer).length).toBeGreaterThan(500);
  });

  it("returns 404 for a project the requesting Developer is not assigned to", async () => {
    prismaMock.project.findUnique.mockResolvedValue(fullProject as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "some-other-profile", userId: "dev-user-1" } as never);
    const devToken = signAccessToken({ sub: "dev-user-1", email: "dev@example.com", role: UserRole.DEVELOPER });

    const res = await request(app)
      .get("/api/projects/project-1/report.pdf")
      .set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(404);
  });
});
