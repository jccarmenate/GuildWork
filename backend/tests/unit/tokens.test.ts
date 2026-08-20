import { beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  verifyAccessToken
} from "../../src/auth/tokens.js";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

describe("access tokens", () => {
  it("signs a token that verifies back to the same payload", () => {
    const token = signAccessToken({ sub: "user-1", email: "a@example.com", role: UserRole.ADMIN });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.email).toBe("a@example.com");
    expect(payload.role).toBe(UserRole.ADMIN);
  });

  it("expires in 15 minutes", () => {
    const token = signAccessToken({ sub: "user-1", email: "a@example.com", role: UserRole.DEVELOPER });
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it("throws on a tampered token", () => {
    const token = signAccessToken({ sub: "user-1", email: "a@example.com", role: UserRole.DEVELOPER });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });

  it("throws on a token signed with the wrong secret", () => {
    const foreignToken = jwt.sign({ sub: "user-1" }, "some-other-secret");
    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });
});

describe("refresh tokens", () => {
  it("generates opaque, high-entropy random tokens that differ each call", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(64);
  });

  it("hashes deterministically so the same token always maps to the same hash", () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashRefreshToken("token-a")).not.toBe(hashRefreshToken("token-b"));
  });

  it("sets an expiry roughly 30 days out", () => {
    const expiry = refreshTokenExpiry();
    const diffDays = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(29.9);
    expect(diffDays).toBeLessThan(30.1);
  });
});
