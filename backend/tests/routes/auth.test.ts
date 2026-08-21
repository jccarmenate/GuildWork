import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole } from "@prisma/client";
import { createApp } from "../../src/app.js";
import { hashPassword } from "../../src/auth/hash.js";
import { hashRefreshToken } from "../../src/auth/tokens.js";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.FRONTEND_ORIGIN = "http://localhost:5173";
});

beforeEach(() => {
  resetPrismaMock();
});

const app = createApp();

function fakeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    email: "dev@example.com",
    name: "Dev One",
    passwordHash: "will-be-set",
    role: UserRole.DEVELOPER,
    createdAt: new Date(),
    ...overrides
  };
}

describe("POST /api/auth/register", () => {
  it("creates a developer by default and returns a token pair", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const created = fakeUser();
    prismaMock.user.create.mockResolvedValue(created as never);
    prismaMock.developerProfile.create.mockResolvedValue({} as never);
    prismaMock.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dev@example.com", password: "Password123!", name: "Dev One" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.role).toBe(UserRole.DEVELOPER);
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: UserRole.DEVELOPER }) })
    );
    const cookies = res.headers["set-cookie"];
    expect(cookies?.[0]).toMatch(/refreshToken=/);
    expect(cookies?.[0]).toMatch(/HttpOnly/i);
  });

  it("rejects duplicate emails with 409", async () => {
    prismaMock.user.findUnique.mockResolvedValue(fakeUser() as never);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dev@example.com", password: "Password123!", name: "Dev One" });

    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short", name: "" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a generic error for an unknown email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("returns the same generic error for a wrong password (does not leak which failed)", async () => {
    const passwordHash = await hashPassword("correct-password");
    prismaMock.user.findUnique.mockResolvedValue(fakeUser({ passwordHash }) as never);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "dev@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("returns a token pair for correct credentials", async () => {
    const passwordHash = await hashPassword("correct-password");
    prismaMock.user.findUnique.mockResolvedValue(fakeUser({ passwordHash }) as never);
    prismaMock.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "dev@example.com", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });
});

describe("POST /api/auth/refresh", () => {
  it("rejects when there is no refresh cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("rotates the token: revokes the old row and issues a new pair", async () => {
    const storedRow = {
      id: "rt-1",
      userId: "user-1",
      tokenHash: hashRefreshToken("valid-token"),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date()
    };
    prismaMock.refreshToken.findFirst.mockResolvedValue(storedRow as never);
    prismaMock.user.findUnique.mockResolvedValue(fakeUser() as never);
    prismaMock.refreshToken.update.mockResolvedValue({} as never);
    prismaMock.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app).post("/api/auth/refresh").set("Cookie", ["refreshToken=valid-token"]);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "rt-1" },
      data: { revokedAt: expect.any(Date) }
    });
    expect(prismaMock.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("detects reuse of an already-revoked token and mass-revokes the user's sessions", async () => {
    const revokedRow = {
      id: "rt-1",
      userId: "user-1",
      tokenHash: hashRefreshToken("stolen-token"),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: new Date(),
      createdAt: new Date()
    };
    prismaMock.refreshToken.findFirst.mockResolvedValue(revokedRow as never);
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 } as never);

    const res = await request(app).post("/api/auth/refresh").set("Cookie", ["refreshToken=stolen-token"]);

    expect(res.status).toBe(401);
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
  });

  it("rejects an expired refresh token", async () => {
    const expiredRow = {
      id: "rt-1",
      userId: "user-1",
      tokenHash: hashRefreshToken("expired-token"),
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      createdAt: new Date()
    };
    prismaMock.refreshToken.findFirst.mockResolvedValue(expiredRow as never);

    const res = await request(app).post("/api/auth/refresh").set("Cookie", ["refreshToken=expired-token"]);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("revokes the refresh row and clears the cookie", async () => {
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 } as never);

    const res = await request(app).post("/api/auth/logout").set("Cookie", ["refreshToken=some-token"]);

    expect(res.status).toBe(204);
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalled();
    const cookies = res.headers["set-cookie"];
    expect(cookies?.[0]).toMatch(/refreshToken=;/);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 with no access token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("Admin-only user management", () => {
  it("only an Admin can change a user's role (PM gets 403)", async () => {
    const { signAccessToken } = await import("../../src/auth/tokens.js");
    const pmToken = signAccessToken({ sub: "pm-1", email: "pm@example.com", role: UserRole.PROJECT_MANAGER });

    const res = await request(app)
      .patch("/api/auth/admin/users/user-1/role")
      .set("Authorization", `Bearer ${pmToken}`)
      .send({ role: UserRole.PROJECT_MANAGER });

    expect(res.status).toBe(403);
  });

  it("an Admin can change a user's role", async () => {
    const { signAccessToken } = await import("../../src/auth/tokens.js");
    const adminToken = signAccessToken({ sub: "admin-1", email: "admin@example.com", role: UserRole.ADMIN });
    prismaMock.user.findUnique.mockResolvedValue(fakeUser({ id: "user-1" }) as never);
    prismaMock.user.update.mockResolvedValue(fakeUser({ id: "user-1", role: UserRole.PROJECT_MANAGER }) as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/auth/admin/users/user-1/role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: UserRole.PROJECT_MANAGER });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe(UserRole.PROJECT_MANAGER);
  });

  it("a Developer is blocked from the admin users list (403)", async () => {
    const { signAccessToken } = await import("../../src/auth/tokens.js");
    const devToken = signAccessToken({ sub: "dev-1", email: "dev@example.com", role: UserRole.DEVELOPER });

    const res = await request(app).get("/api/auth/admin/users").set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(403);
  });
});
