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

describe("Global error handling", () => {
  it("returns a generic 500 instead of crashing when a route handler's promise rejects", async () => {
    prismaMock.client.findMany.mockRejectedValue(new Error("db exploded"));

    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  it("does not leak the underlying error message to the client", async () => {
    prismaMock.client.findMany.mockRejectedValue(new Error("secret connection string exposed"));

    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${adminToken}`);

    expect(JSON.stringify(res.body)).not.toContain("secret connection string");
  });

  it("a thrown synchronous error inside an async handler is also caught", async () => {
    prismaMock.client.findMany.mockImplementation(() => {
      throw new Error("sync boom");
    });

    const res = await request(app).get("/api/clients").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
