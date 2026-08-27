import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { parsePagination, toPage } from "../lib/pagination.js";
import { recordAuditLog } from "../lib/auditLog.js";

const router = Router();

const clientSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable()
});

const managerRoles = [UserRole.ADMIN, UserRole.PROJECT_MANAGER];

router.use(requireAuth, requireRole(...managerRoles));

router.get("/", async (req, res) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const where = { deletedAt: null };
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize
    }),
    prisma.client.count({ where })
  ]);
  res.json(toPage(clients, total, pagination));
});

router.get("/:id", async (req, res) => {
  const client = await prisma.client.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(client);
});

router.post("/", async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid client data", details: parsed.error.flatten() });
    return;
  }
  const client = await prisma.client.create({ data: parsed.data });
  res.status(201).json(client);
});

router.patch("/:id", async (req, res) => {
  const parsed = clientSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid client data", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const client = await prisma.client.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(client);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  await prisma.client.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  await recordAuditLog({
    actorUserId: req.user!.id,
    action: "CLIENT_DELETED",
    entityType: "Client",
    entityId: req.params.id,
    metadata: { name: existing.name }
  });
  res.status(204).send();
});

router.post("/:id/restore", async (req, res) => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id } });
  if (!existing || !existing.deletedAt) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const client = await prisma.client.update({ where: { id: req.params.id }, data: { deletedAt: null } });
  await recordAuditLog({
    actorUserId: req.user!.id,
    action: "CLIENT_RESTORED",
    entityType: "Client",
    entityId: req.params.id,
    metadata: { name: existing.name }
  });
  res.json(client);
});

export default router;
