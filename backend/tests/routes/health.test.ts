import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { createApp } from "../../src/app.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

beforeEach(() => {
  resetPrismaMock();
});

const app = createApp();

describe("GET /api/health", () => {
  it("returns 200 when the database responds", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }] as never);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns 503 when the database is unreachable", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("connection refused"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "unavailable" });
  });
});
