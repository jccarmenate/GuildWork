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

describe("Projects: soft delete", () => {
  it("DELETE marks deletedAt instead of physically deleting the row", async () => {
    prismaMock.project.findFirst.mockResolvedValue(fakeProject() as never);
    prismaMock.project.update.mockResolvedValue(fakeProject({ deletedAt: new Date() }) as never);

    const res = await request(app)
      .delete("/api/projects/project-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    expect(prismaMock.project.delete).not.toHaveBeenCalled();
    expect(prismaMock.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "project-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) })
      })
    );
  });

  it("DELETE on an already soft-deleted project returns 404", async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/projects/project-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("GET list excludes soft-deleted projects", async () => {
    prismaMock.project.findMany.mockResolvedValue([] as never);

    await request(app).get("/api/projects").set("Authorization", `Bearer ${adminToken}`);

    const callArgs = prismaMock.project.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(callArgs.where.deletedAt).toBeNull();
  });

  it("GET detail on a soft-deleted project returns 404, even for Admin", async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    const res = await request(app).get("/api/projects/project-1").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    const callArgs = prismaMock.project.findFirst.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(callArgs.where.deletedAt).toBeNull();
  });

  it("POST /:id/restore clears deletedAt", async () => {
    prismaMock.project.findFirst.mockResolvedValue(fakeProject({ deletedAt: new Date() }) as never);
    prismaMock.project.update.mockResolvedValue(fakeProject() as never);

    const res = await request(app)
      .post("/api/projects/project-1/restore")
      .set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: { deletedAt: null }
    });
  });

  it("Developer is blocked from restoring a project (403)", async () => {
    const res = await request(app)
      .post("/api/projects/project-1/restore")
      .set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(403);
  });

  it("cannot add an assignment to a soft-deleted project (404)", async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/projects/project-1/assignments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ developerId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(404);
  });
});

describe("Clients: soft delete", () => {
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

  it("DELETE marks deletedAt instead of physically deleting the row", async () => {
    prismaMock.client.findFirst.mockResolvedValue(fakeClient() as never);
    prismaMock.client.update.mockResolvedValue(fakeClient({ deletedAt: new Date() }) as never);

    const res = await request(app)
      .delete("/api/clients/client-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    expect(prismaMock.client.delete).not.toHaveBeenCalled();
    expect(prismaMock.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "client-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) })
      })
    );
  });

  it("GET list excludes soft-deleted clients", async () => {
    prismaMock.client.findMany.mockResolvedValue([] as never);

    await request(app).get("/api/clients").set("Authorization", `Bearer ${adminToken}`);

    const callArgs = prismaMock.client.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(callArgs.where.deletedAt).toBeNull();
  });

  it("POST /:id/restore clears deletedAt", async () => {
    prismaMock.client.findFirst.mockResolvedValue(fakeClient({ deletedAt: new Date() }) as never);
    prismaMock.client.update.mockResolvedValue(fakeClient() as never);

    const res = await request(app)
      .post("/api/clients/client-1/restore")
      .set("Authorization", `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(prismaMock.client.update).toHaveBeenCalledWith({
      where: { id: "client-1" },
      data: { deletedAt: null }
    });
  });
});
