import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { captureException } from "../lib/sentry.js";

// Express only recognizes this as error-handling middleware because it takes
// four arguments — the unused `_next` is required for that arity check, not
// for anything it does with it.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  captureException(err);

  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}
