import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole } from "@prisma/client";
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
const devToken = signAccessToken({ sub: "dev-user-1", email: "dev@example.com", role: UserRole.DEVELOPER });

describe("Pagination: GET /api/projects", () => {
  it("applies default page 1 / pageSize 25 and returns an envelope", async () => {
    prismaMock.project.findMany.mockResolvedValue([] as never);
    prismaMock.project.count.mockResolvedValue(0);

    const res = await request(app).get("/api/projects").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
    expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 25 }));
  });

  it("honors page and pageSize query params", async () => {
    prismaMock.project.findMany.mockResolvedValue([] as never);
    prismaMock.project.count.mockResolvedValue(37);

    const res = await request(app)
      .get("/api/projects?page=2&pageSize=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 37, page: 2, pageSize: 10 });
    expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
  });
});

describe("Pagination: GET /api/clients", () => {
  it("returns a paginated envelope", async () => {
    prismaMock.client.findMany.mockResolvedValue([] as never);
    prismaMock.client.count.mockResolvedValue(3);

    const res = await request(app).get("/api/clients?pageSize=2").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 3, page: 1, pageSize: 2 });
    expect(prismaMock.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 2 }));
  });
});

describe("Pagination: GET /api/developers", () => {
  it("returns a paginated envelope", async () => {
    prismaMock.developerProfile.findMany.mockResolvedValue([] as never);
    prismaMock.developerProfile.count.mockResolvedValue(5);

    const res = await request(app).get("/api/developers").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 5, page: 1, pageSize: 25 });
    expect(prismaMock.developerProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 25 }));
  });
});

describe("Pagination: GET /api/bugs", () => {
  it("paginates the manager (all bugs) view", async () => {
    prismaMock.bug.findMany.mockResolvedValue([] as never);
    prismaMock.bug.count.mockResolvedValue(120);

    const res = await request(app).get("/api/bugs?page=3").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 120, page: 3, pageSize: 25 });
    expect(prismaMock.bug.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 50, take: 25 }));
  });

  it("paginates the developer (own bugs) view", async () => {
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);
    prismaMock.bug.findMany.mockResolvedValue([] as never);
    prismaMock.bug.count.mockResolvedValue(2);

    const res = await request(app).get("/api/bugs").set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 2, page: 1, pageSize: 25 });
  });
});
