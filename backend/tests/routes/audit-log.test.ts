import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole, Priority, ProjectStatus } from "@prisma/client";
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
  deletedAt: null,
  createdByUserId: "pm-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe("Audit log: role changes", () => {
  it("records USER_ROLE_CHANGED when an Admin changes a user's role", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1", role: UserRole.DEVELOPER } as never);
    prismaMock.user.update.mockResolvedValue({ id: "user-1", email: "x@example.com", name: "X", role: UserRole.PROJECT_MANAGER } as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await request(app)
      .patch("/api/auth/admin/users/user-1/role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: UserRole.PROJECT_MANAGER });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-1",
        action: "USER_ROLE_CHANGED",
        entityType: "User",
        entityId: "user-1",
        metadata: { from: UserRole.DEVELOPER, to: UserRole.PROJECT_MANAGER }
      })
    });
  });
});

describe("Audit log: project deletions", () => {
  it("records PROJECT_DELETED on soft delete", async () => {
    prismaMock.project.findFirst.mockResolvedValue(fakeProject() as never);
    prismaMock.project.update.mockResolvedValue(fakeProject({ deletedAt: new Date() }) as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await request(app).delete("/api/projects/project-1").set("Authorization", `Bearer ${adminToken}`);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-1",
        action: "PROJECT_DELETED",
        entityType: "Project",
        entityId: "project-1"
      })
    });
  });

  it("records PROJECT_RESTORED on restore", async () => {
    prismaMock.project.findFirst.mockResolvedValue(fakeProject({ deletedAt: new Date() }) as never);
    prismaMock.project.update.mockResolvedValue(fakeProject() as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await request(app).post("/api/projects/project-1/restore").set("Authorization", `Bearer ${pmToken}`);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "pm-1",
        action: "PROJECT_RESTORED",
        entityType: "Project",
        entityId: "project-1"
      })
    });
  });
});

describe("Audit log: client deletions", () => {
  const fakeClient = (overrides: Record<string, unknown> = {}) => ({
    id: "client-1",
    name: "Northwind",
    industry: null,
    contactName: null,
    contactEmail: null,
    deletedAt: null,
    createdAt: new Date(),
    ...overrides
  });

  it("records CLIENT_DELETED on soft delete", async () => {
    prismaMock.client.findFirst.mockResolvedValue(fakeClient() as never);
    prismaMock.client.update.mockResolvedValue(fakeClient({ deletedAt: new Date() }) as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await request(app).delete("/api/clients/client-1").set("Authorization", `Bearer ${adminToken}`);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-1",
        action: "CLIENT_DELETED",
        entityType: "Client",
        entityId: "client-1"
      })
    });
  });

  it("records CLIENT_RESTORED on restore", async () => {
    prismaMock.client.findFirst.mockResolvedValue(fakeClient({ deletedAt: new Date() }) as never);
    prismaMock.client.update.mockResolvedValue(fakeClient() as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await request(app).post("/api/clients/client-1/restore").set("Authorization", `Bearer ${adminToken}`);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-1",
        action: "CLIENT_RESTORED",
        entityType: "Client",
        entityId: "client-1"
      })
    });
  });
});

describe("Audit log: bug deletions", () => {
  it("records BUG_DELETED", async () => {
    prismaMock.bug.findUnique.mockResolvedValue({ id: "bug-1", projectId: "project-1" } as never);
    prismaMock.bug.delete.mockResolvedValue({} as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await request(app).delete("/api/bugs/bug-1").set("Authorization", `Bearer ${adminToken}`);

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-1",
        action: "BUG_DELETED",
        entityType: "Bug",
        entityId: "bug-1"
      })
    });
  });
});

describe("GET /api/audit-log", () => {
  it("Admin can list the audit log, paginated", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([] as never);
    prismaMock.auditLog.count.mockResolvedValue(0);

    const res = await request(app).get("/api/audit-log").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
  });

  it("PM is blocked (403)", async () => {
    const res = await request(app).get("/api/audit-log").set("Authorization", `Bearer ${pmToken}`);
    expect(res.status).toBe(403);
  });

  it("Developer is blocked (403)", async () => {
    const res = await request(app).get("/api/audit-log").set("Authorization", `Bearer ${devToken}`);
    expect(res.status).toBe(403);
  });
});
