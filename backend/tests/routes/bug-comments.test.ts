import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole, Severity, BugStatus } from "@prisma/client";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/auth/tokens.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

beforeEach(() => {
  resetPrismaMock();
});

const app = createApp();

const adminToken = signAccessToken({ sub: "admin-1", email: "admin@example.com", role: UserRole.ADMIN });
const pmToken = signAccessToken({ sub: "pm-1", email: "pm@example.com", role: UserRole.PROJECT_MANAGER });
const devToken = signAccessToken({ sub: "dev-user-1", email: "dev@example.com", role: UserRole.DEVELOPER });
const otherDevToken = signAccessToken({ sub: "dev-user-2", email: "dev2@example.com", role: UserRole.DEVELOPER });

const assignedBug = {
  id: "bug-1",
  projectId: "project-1",
  title: "Checkout broken",
  description: null,
  severity: Severity.MEDIUM,
  status: BugStatus.OPEN,
  reportedByUserId: "pm-1",
  assignedToDeveloperId: "dev-profile-1",
  createdAt: new Date(),
  resolvedAt: null
};

describe("POST /api/bugs/:id/comments", () => {
  it("Admin can comment on any bug", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bugComment.create.mockResolvedValue({
      id: "comment-1",
      bugId: "bug-1",
      authorUserId: "admin-1",
      body: "Looking into this",
      createdAt: new Date(),
      author: { id: "admin-1", name: "Admin" }
    } as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/comments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ body: "Looking into this" });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe("Looking into this");
  });

  it("Developer can comment on their own assigned bug", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);
    prismaMock.bugComment.create.mockResolvedValue({ id: "comment-1" } as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/comments")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ body: "On it" });

    expect(res.status).toBe(201);
  });

  it("Developer is blocked (403) from commenting on a bug not assigned to them", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "different-profile", userId: "dev-user-2" } as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/comments")
      .set("Authorization", `Bearer ${otherDevToken}`)
      .send({ body: "Can I help?" });

    expect(res.status).toBe(403);
    expect(prismaMock.bugComment.create).not.toHaveBeenCalled();
  });

  it("returns 404 for a bug that does not exist", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/bugs/missing-bug/comments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ body: "Hi" });

    expect(res.status).toBe(404);
  });

  it("rejects an empty comment body", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/comments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ body: "" });

    expect(res.status).toBe(400);
    expect(prismaMock.bugComment.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/bugs/:id/comments", () => {
  it("PM can view comments on any bug, oldest first", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bugComment.findMany.mockResolvedValue([
      { id: "c1", body: "first", createdAt: new Date(2026, 0, 1), author: { id: "pm-1", name: "PM" } },
      { id: "c2", body: "second", createdAt: new Date(2026, 0, 2), author: { id: "dev-user-1", name: "Dev" } }
    ] as never);

    const res = await request(app).get("/api/bugs/bug-1/comments").set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(prismaMock.bugComment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { bugId: "bug-1" }, orderBy: { createdAt: "asc" } })
    );
  });

  it("Developer is blocked (403) from viewing comments on a bug not assigned to them", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "different-profile", userId: "dev-user-2" } as never);

    const res = await request(app).get("/api/bugs/bug-1/comments").set("Authorization", `Bearer ${otherDevToken}`);

    expect(res.status).toBe(403);
  });
});
