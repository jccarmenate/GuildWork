import type { Response } from "express";
import { REFRESH_TOKEN_TTL_MS } from "./tokens.js";

export const REFRESH_COOKIE_NAME = "refreshToken";

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: "/api/auth"
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
}
