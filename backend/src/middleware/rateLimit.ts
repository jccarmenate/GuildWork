import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

export function createRateLimiter(options: { windowMs: number; limit: number }): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: true,
    legacyHeaders: false
  });
}

// Baseline ceiling for every route — generous enough not to bother a real
// user, tight enough to blunt scripted abuse. Auth routes layer their own
// stricter limiter on top of this one; the PDF report route does the same.
export const globalRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 300 });

// PDF generation is CPU-bound (pdfkit renders synchronously), so it gets a
// tighter ceiling than ordinary JSON endpoints.
export const reportRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 20 });
