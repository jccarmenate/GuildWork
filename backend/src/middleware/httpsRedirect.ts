import type { NextFunction, Request, Response } from "express";

// Defense-in-depth only: most hosts (Vercel, Railway) already terminate TLS
// and redirect at their own edge, so this never fires there. It exists for
// the case of a reverse proxy that forwards plain http without redirecting
// itself — we only act when it tells us so via x-forwarded-proto, and only
// in production, so local dev and tests are never affected.
export function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] === "http") {
    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    return;
  }
  next();
}
