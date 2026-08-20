import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../../src/auth/middleware.js";
import { signAccessToken } from "../../src/auth/tokens.js";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed Authorization header", () => {
    const req = { headers: { authorization: "Basic abc" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired or invalid token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next for a valid token", () => {
    const token = signAccessToken({ sub: "user-1", email: "a@example.com", role: UserRole.PROJECT_MANAGER });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: "user-1", email: "a@example.com", role: UserRole.PROJECT_MANAGER });
  });
});

describe("requireRole", () => {
  it("returns 401 if requireAuth has not run (no req.user)", () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    requireRole(UserRole.ADMIN)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the user's role is not in the allowed list", () => {
    const req = { user: { id: "u1", email: "a@example.com", role: UserRole.DEVELOPER } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the user's role is allowed", () => {
    const req = { user: { id: "u1", email: "a@example.com", role: UserRole.ADMIN } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
