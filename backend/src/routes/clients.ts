import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = Router();

const clientSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable()
});

const managerRoles = [UserRole.ADMIN, UserRole.PROJECT_MANAGER];

router.use(requireAuth, requireRole(...managerRoles));

router.get("/", async (_req, res) => {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  res.json(clients);
});

router.get("/:id", async (req, res) => {
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
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
  const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const client = await prisma.client.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(client);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  await prisma.client.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
