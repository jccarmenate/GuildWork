import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { parsePagination, toPage } from "../lib/pagination.js";

const router = Router();

router.use(requireAuth, requireRole(UserRole.ADMIN));

router.get("/", async (req, res) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { entityType, entityId } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  res.json(toPage(entries, total, pagination));
});

export default router;
