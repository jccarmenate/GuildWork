import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { createApp } from "../../src/app.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

const app = createApp();

describe("Security headers", () => {
  it("sets helmet's baseline hardening headers on every response", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
