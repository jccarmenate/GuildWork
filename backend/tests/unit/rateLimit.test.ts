import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { createRateLimiter } from "../../src/middleware/rateLimit.js";

describe("createRateLimiter", () => {
  it("allows requests up to the limit and blocks the next one with 429", async () => {
    const app = express();
    app.use(createRateLimiter({ windowMs: 60_000, limit: 2 }));
    app.get("/", (_req, res) => res.json({ ok: true }));

    const first = await request(app).get("/");
    const second = await request(app).get("/");
    const third = await request(app).get("/");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });
});
