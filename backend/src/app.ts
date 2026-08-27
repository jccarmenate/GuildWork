import "express-async-errors";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { pinoHttp } from "pino-http";
import { openApiSpec } from "./openapi.js";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import projectRoutes from "./routes/projects.js";
import bugRoutes from "./routes/bugs.js";
import developerRoutes from "./routes/developers.js";
import skillRoutes from "./routes/skills.js";
import analyticsRoutes from "./routes/analytics.js";
import auditLogRoutes from "./routes/auditLog.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errors.js";
import { globalRateLimit } from "./middleware/rateLimit.js";
import { prisma } from "./lib/prisma.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimit);

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/bugs", bugRoutes);
  app.use("/api/developers", developerRoutes);
  app.use("/api/skills", skillRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/audit-log", auditLogRoutes);

  // The API map itself isn't sensitive, but there's no reason to hand it to
  // the open internet either — only mounted outside production.
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/openapi.json", (_req, res) => {
      res.json(openApiSpec);
    });
    // Swagger UI's bundled init script is inline, which the app-wide CSP
    // (already set by the helmet() above) blocks — dropped only for this
    // documentation route, nowhere else.
    app.use(
      "/api/docs",
      (_req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.removeHeader("Content-Security-Policy");
        next();
      },
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec)
    );
  }

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(errorHandler);

  return app;
}
