import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

function accessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, accessSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, accessSecret()) as AccessTokenPayload;
}

// Refresh tokens are opaque random values, not JWTs: the client only ever
// needs to hand the raw value back in a cookie, and keeping them opaque means
// revocation is a single DB row flip rather than a blocklist of JWT ids.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// Only the hash is persisted so a leaked database dump can't be replayed as
// valid session cookies.
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}
