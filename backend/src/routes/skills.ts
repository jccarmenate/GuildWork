import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = Router();

const managerRoles = [UserRole.ADMIN, UserRole.PROJECT_MANAGER];

const skillSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().nullable()
});

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  res.json(skills);
});

router.post("/", requireRole(...managerRoles), async (req, res) => {
  const parsed = skillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid skill data", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.skill.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    res.status(409).json({ error: "Skill already exists" });
    return;
  }
  const skill = await prisma.skill.create({ data: parsed.data });
  res.status(201).json(skill);
});

router.patch("/:id", requireRole(...managerRoles), async (req, res) => {
  const parsed = skillSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid skill data", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.skill.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  const skill = await prisma.skill.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(skill);
});

router.delete("/:id", requireRole(...managerRoles), async (req, res) => {
  const existing = await prisma.skill.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  await prisma.skill.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
