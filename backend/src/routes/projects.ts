import { Router } from "express";
import { z } from "zod";
import { Priority, ProjectStatus, Severity, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { generateProjectReportPdf } from "../pdf/projectReport.js";
import { reportRateLimit } from "../middleware/rateLimit.js";

const router = Router();

const managerRoles = [UserRole.ADMIN, UserRole.PROJECT_MANAGER];

const projectSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  budget: z.number().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable()
});

const assignmentSchema = z.object({
  developerId: z.string().uuid(),
  roleOnProject: z.string().optional().nullable(),
  hoursAllocated: z.number().optional().nullable()
});

const projectSkillSchema = z.object({
  skillId: z.string().uuid()
});

const bugCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  severity: z.nativeEnum(Severity).optional(),
  assignedToDeveloperId: z.string().uuid().optional().nullable()
});

const detailInclude = {
  client: true,
  requiredSkills: { include: { skill: true } },
  assignments: { include: { developer: { include: { user: true } } } },
  bugs: true
} as const;

async function developerProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.developerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { status, priority, clientId, search } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = { deletedAt: null };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (clientId) where.clientId = clientId;
  if (search) where.name = { contains: search, mode: "insensitive" };

  if (req.user!.role === UserRole.DEVELOPER) {
    const devId = await developerProfileId(req.user!.id);
    if (!devId) {
      res.json([]);
      return;
    }
    where.assignments = { some: { developerId: devId } };
  }

  const projects = await prisma.project.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(projects);
});

router.get("/:id", async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: detailInclude
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (req.user!.role === UserRole.DEVELOPER) {
    const devId = await developerProfileId(req.user!.id);
    const assigned = project.assignments.some((a) => a.developerId === devId);
    if (!assigned) {
      // Hide existence rather than 403: a developer shouldn't be able to
      // probe which projects exist by watching the status code change.
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }

  res.json(project);
});

router.post("/", requireRole(...managerRoles), async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project data", details: parsed.error.flatten() });
    return;
  }
  const project = await prisma.project.create({
    data: { ...parsed.data, createdByUserId: req.user!.id }
  });
  res.status(201).json(project);
});

router.patch("/:id", requireRole(...managerRoles), async (req, res) => {
  const parsed = projectSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid project data", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.project.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const project = await prisma.project.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(project);
});

router.delete("/:id", requireRole(...managerRoles), async (req, res) => {
  const existing = await prisma.project.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
  res.status(204).send();
});

router.post("/:id/restore", requireRole(...managerRoles), async (req, res) => {
  const existing = await prisma.project.findFirst({ where: { id: req.params.id } });
  if (!existing || !existing.deletedAt) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const project = await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: null } });
  res.json(project);
});

router.post("/:id/assignments", requireRole(...managerRoles), async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid assignment data", details: parsed.error.flatten() });
    return;
  }
  const project = await prisma.project.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const assignment = await prisma.projectAssignment.create({
    data: { projectId: req.params.id, ...parsed.data }
  });
  res.status(201).json(assignment);
});

router.delete("/:id/assignments/:developerId", requireRole(...managerRoles), async (req, res) => {
  const assignment = await prisma.projectAssignment.findUnique({
    where: { projectId_developerId: { projectId: req.params.id, developerId: req.params.developerId } }
  });
  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }
  await prisma.projectAssignment.delete({ where: { id: assignment.id } });
  res.status(204).send();
});

router.post("/:id/skills", requireRole(...managerRoles), async (req, res) => {
  const parsed = projectSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid skill data", details: parsed.error.flatten() });
    return;
  }
  const project = await prisma.project.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const projectSkill = await prisma.projectSkill.create({
    data: { projectId: req.params.id, skillId: parsed.data.skillId }
  });
  res.status(201).json(projectSkill);
});

router.delete("/:id/skills/:skillId", requireRole(...managerRoles), async (req, res) => {
  const projectSkill = await prisma.projectSkill.findUnique({
    where: { projectId_skillId: { projectId: req.params.id, skillId: req.params.skillId } }
  });
  if (!projectSkill) {
    res.status(404).json({ error: "Required skill not found" });
    return;
  }
  await prisma.projectSkill.delete({ where: { id: projectSkill.id } });
  res.status(204).send();
});

router.post("/:id/bugs", requireRole(...managerRoles), async (req, res) => {
  const parsed = bugCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid bug data", details: parsed.error.flatten() });
    return;
  }
  const project = await prisma.project.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const bug = await prisma.bug.create({
    data: { projectId: req.params.id, reportedByUserId: req.user!.id, ...parsed.data }
  });
  res.status(201).json(bug);
});

router.get("/:id/report.pdf", reportRateLimit, async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: detailInclude
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (req.user!.role === UserRole.DEVELOPER) {
    const devId = await developerProfileId(req.user!.id);
    const assigned = project.assignments.some((a) => a.developerId === devId);
    if (!assigned) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="project-${project.id}-report.pdf"`);
  generateProjectReportPdf(project).pipe(res);
});

export default router;
