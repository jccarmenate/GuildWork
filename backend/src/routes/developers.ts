import { Router } from "express";
import { z } from "zod";
import { Proficiency, Seniority, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = Router();

const managerRoles = [UserRole.ADMIN, UserRole.PROJECT_MANAGER];

const profileInclude = {
  user: { select: { id: true, name: true, email: true } },
  skills: { include: { skill: true } },
  mentor: { include: { user: { select: { id: true, name: true } } } },
  assignments: { include: { project: true } }
} as const;

// Seniority and mentor assignment are career decisions a manager makes about
// a developer, not self-reported — so PATCH /me is limited to bio, and
// seniority/mentor changes live behind the Admin/PM-only PATCH /:id.
const selfUpdateSchema = z.object({
  bio: z.string().optional().nullable()
});

const managerUpdateSchema = z.object({
  bio: z.string().optional().nullable(),
  seniority: z.nativeEnum(Seniority).optional(),
  mentorId: z.string().uuid().optional().nullable()
});

const addSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.nativeEnum(Proficiency).optional()
});

router.use(requireAuth);

router.get("/", requireRole(...managerRoles), async (_req, res) => {
  const developers = await prisma.developerProfile.findMany({ include: profileInclude });
  res.json(developers);
});

router.get("/me", async (req, res) => {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId: req.user!.id },
    include: profileInclude
  });
  if (!profile) {
    res.status(404).json({ error: "Developer profile not found" });
    return;
  }
  res.json(profile);
});

router.patch("/me", async (req, res) => {
  const parsed = selfUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() });
    return;
  }
  const profile = await prisma.developerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) {
    res.status(404).json({ error: "Developer profile not found" });
    return;
  }
  const updated = await prisma.developerProfile.update({
    where: { id: profile.id },
    data: parsed.data,
    include: profileInclude
  });
  res.json(updated);
});

router.post("/me/skills", async (req, res) => {
  const parsed = addSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid skill data", details: parsed.error.flatten() });
    return;
  }
  const profile = await prisma.developerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) {
    res.status(404).json({ error: "Developer profile not found" });
    return;
  }
  const skill = await prisma.developerSkill.upsert({
    where: { developerId_skillId: { developerId: profile.id, skillId: parsed.data.skillId } },
    update: { proficiency: parsed.data.proficiency ?? Proficiency.BEGINNER },
    create: {
      developerId: profile.id,
      skillId: parsed.data.skillId,
      proficiency: parsed.data.proficiency ?? Proficiency.BEGINNER
    },
    include: { skill: true }
  });
  res.status(201).json(skill);
});

router.delete("/me/skills/:skillId", async (req, res) => {
  const profile = await prisma.developerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) {
    res.status(404).json({ error: "Developer profile not found" });
    return;
  }
  const existing = await prisma.developerSkill.findUnique({
    where: { developerId_skillId: { developerId: profile.id, skillId: req.params.skillId } }
  });
  if (!existing) {
    res.status(404).json({ error: "Skill not found on profile" });
    return;
  }
  await prisma.developerSkill.delete({ where: { id: existing.id } });
  res.status(204).send();
});

router.get("/:id", requireRole(...managerRoles), async (req, res) => {
  const profile = await prisma.developerProfile.findUnique({
    where: { id: req.params.id },
    include: profileInclude
  });
  if (!profile) {
    res.status(404).json({ error: "Developer profile not found" });
    return;
  }
  res.json(profile);
});

router.patch("/:id", requireRole(...managerRoles), async (req, res) => {
  const parsed = managerUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.developerProfile.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Developer profile not found" });
    return;
  }
  const updated = await prisma.developerProfile.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: profileInclude
  });
  res.json(updated);
});

export default router;
