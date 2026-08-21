import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  bugSeverityBreakdown,
  mentorship,
  projectCompletion,
  skillCoverage,
  topPerformers,
  workload
} from "../analytics/queries.js";

const router = Router();

router.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.PROJECT_MANAGER));

router.get("/bug-severity", async (_req, res) => {
  res.json(await bugSeverityBreakdown(prisma));
});

router.get("/workload", async (_req, res) => {
  res.json(await workload(prisma));
});

router.get("/mentorship", async (_req, res) => {
  res.json(await mentorship(prisma));
});

router.get("/project-completion", async (_req, res) => {
  res.json(await projectCompletion(prisma));
});

router.get("/skill-coverage", async (_req, res) => {
  res.json(await skillCoverage(prisma));
});

router.get("/top-performers", async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  res.json(await topPerformers(prisma, Number.isFinite(limit) ? limit : 5));
});

export default router;
