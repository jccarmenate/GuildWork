import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import projectRoutes from "./routes/projects.js";
import bugRoutes from "./routes/bugs.js";
import developerRoutes from "./routes/developers.js";
import skillRoutes from "./routes/skills.js";
import analyticsRoutes from "./routes/analytics.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/bugs", bugRoutes);
  app.use("/api/developers", developerRoutes);
  app.use("/api/skills", skillRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
