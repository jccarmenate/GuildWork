import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole, Severity, BugStatus, Priority, ProjectStatus } from "@prisma/client";
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

const fakeProject = (overrides: Record<string, unknown> = {}) => ({
  id: "project-1",
  clientId: "client-1",
  name: "Storefront Revamp",
  description: null,
  priority: Priority.HIGH,
  status: ProjectStatus.ACTIVE,
  budget: null,
  startDate: new Date(),
  endDate: null,
  createdByUserId: "pm-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe("Projects: creation is Admin/PM only", () => {
  it("Admin can create a project", async () => {
    prismaMock.project.create.mockResolvedValue(fakeProject() as never);

    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ clientId: "11111111-1111-1111-1111-111111111111", name: "Storefront Revamp", startDate: "2026-01-01" });

    expect(res.status).toBe(201);
  });

  it("PM can create a project", async () => {
    prismaMock.project.create.mockResolvedValue(fakeProject() as never);

    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({ clientId: "11111111-1111-1111-1111-111111111111", name: "Storefront Revamp", startDate: "2026-01-01" });

    expect(res.status).toBe(201);
  });

  it("Developer is blocked from creating a project (403)", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ clientId: "11111111-1111-1111-1111-111111111111", name: "Storefront Revamp", startDate: "2026-01-01" });

    expect(res.status).toBe(403);
    expect(prismaMock.project.create).not.toHaveBeenCalled();
  });
});

describe("Clients: full list is Admin/PM only", () => {
  it("Admin can list clients", async () => {
    prismaMock.client.findMany.mockResolvedValue([] as never);
    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it("PM can list clients", async () => {
    prismaMock.client.findMany.mockResolvedValue([] as never);
    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${pmToken}`);
    expect(res.status).toBe(200);
  });

  it("Developer is blocked from listing clients (403)", async () => {
    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${devToken}`);
    expect(res.status).toBe(403);
  });
});

describe("Projects: developer-scoped list", () => {
  it("Developer's GET /api/projects only returns their assigned projects, not all", async () => {
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);
    prismaMock.project.findMany.mockResolvedValue([fakeProject()] as never);

    const res = await request(app).get("/api/projects").set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(200);
    expect(prismaMock.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assignments: { some: { developerId: "dev-profile-1" } } })
      })
    );
  });

  it("Admin's GET /api/projects is not scoped to any assignment filter", async () => {
    prismaMock.project.findMany.mockResolvedValue([] as never);

    await request(app).get("/api/projects").set("Authorization", `Bearer ${adminToken}`);

    const callArgs = prismaMock.project.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(callArgs.where.assignments).toBeUndefined();
  });
});

describe("Projects: detail visibility for Developers", () => {
  it("Developer requesting a non-assigned project's detail gets 404, not 403", async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      ...fakeProject(),
      client: { id: "client-1", name: "Northwind" },
      requiredSkills: [],
      assignments: [{ developerId: "someone-elses-profile" }],
      bugs: []
    } as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);

    const res = await request(app).get("/api/projects/project-1").set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(404);
  });

  it("Developer requesting their own assigned project's detail gets 200", async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      ...fakeProject(),
      client: { id: "client-1", name: "Northwind" },
      requiredSkills: [],
      assignments: [{ developerId: "dev-profile-1" }],
      bugs: []
    } as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);

    const res = await request(app).get("/api/projects/project-1").set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(200);
  });
});

describe("Bugs: field-level restriction for Developers", () => {
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

  it("Developer is blocked from reassigning a bug (403)", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);

    const res = await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ assignedToDeveloperId: "someone-else" });

    expect(res.status).toBe(403);
    expect(prismaMock.bug.update).not.toHaveBeenCalled();
  });

  it("Developer is blocked from changing a bug's severity (403)", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);

    const res = await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ severity: Severity.CRITICAL });

    expect(res.status).toBe(403);
    expect(prismaMock.bug.update).not.toHaveBeenCalled();
  });

  it("Developer CAN update status on their own assigned bug", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);
    prismaMock.bug.update.mockResolvedValue({ ...assignedBug, status: BugStatus.IN_PROGRESS } as never);

    const res = await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ status: BugStatus.IN_PROGRESS });

    expect(res.status).toBe(200);
    expect(prismaMock.bug.update).toHaveBeenCalledOnce();
  });

  it("Developer is blocked from updating a bug assigned to someone else (403)", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "different-profile", userId: "dev-user-2" } as never);

    const res = await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${otherDevToken}`)
      .send({ status: BugStatus.IN_PROGRESS });

    expect(res.status).toBe(403);
  });

  it("PM can reassign and change severity freely", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bug.update.mockResolvedValue({ ...assignedBug, severity: Severity.CRITICAL } as never);

    const res = await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({ severity: Severity.CRITICAL, assignedToDeveloperId: "22222222-2222-2222-2222-222222222222" });

    expect(res.status).toBe(200);
  });

  it("Developer is blocked from deleting a bug (403)", async () => {
    const res = await request(app).delete("/api/bugs/bug-1").set("Authorization", `Bearer ${devToken}`);
    expect(res.status).toBe(403);
    expect(prismaMock.bug.delete).not.toHaveBeenCalled();
  });
});

describe("Developer own-skill management", () => {
  it("Developer can add a skill to their own profile", async () => {
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);
    prismaMock.developerSkill.upsert.mockResolvedValue({ id: "ds-1" } as never);

    const res = await request(app)
      .post("/api/developers/me/skills")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ skillId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(201);
  });

  it("Developer is blocked from listing all developer profiles (403)", async () => {
    const res = await request(app).get("/api/developers").set("Authorization", `Bearer ${devToken}`);
    expect(res.status).toBe(403);
  });
});

describe("Users: only Admin can change roles", () => {
  it("PM is blocked (403) from changing a user's role", async () => {
    const res = await request(app)
      .patch("/api/auth/admin/users/user-1/role")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({ role: UserRole.PROJECT_MANAGER });
    expect(res.status).toBe(403);
  });

  it("Developer is blocked (403) from changing a user's role", async () => {
    const res = await request(app)
      .patch("/api/auth/admin/users/user-1/role")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ role: UserRole.PROJECT_MANAGER });
    expect(res.status).toBe(403);
  });
});

describe("Unauthenticated access", () => {
  it("is rejected with 401 across role-gated routes", async () => {
    const clientsRes = await request(app).get("/api/clients");
    const projectsRes = await request(app).get("/api/projects");
    expect(clientsRes.status).toBe(401);
    expect(projectsRes.status).toBe(401);
  });
});
