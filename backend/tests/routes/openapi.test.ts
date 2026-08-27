import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { createApp } from "../../src/app.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

const app = createApp();

describe("API documentation", () => {
  it("serves the raw OpenAPI spec as JSON with the expected top-level shape", async () => {
    const res = await request(app).get("/api/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths).toHaveProperty("/bugs/{id}/comments");
    expect(res.body.components.schemas).toHaveProperty("Project");
  });

  it("serves the Swagger UI page", async () => {
    const res = await request(app).get("/api/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
  });
});
