import { Router } from "express";
import { z } from "zod";
import { BugStatus, Severity, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { parsePagination, toPage } from "../lib/pagination.js";
import { recordAuditLog } from "../lib/auditLog.js";

const router = Router();

const managerRoles: UserRole[] = [UserRole.ADMIN, UserRole.PROJECT_MANAGER];

const managerUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  severity: z.nativeEnum(Severity).optional(),
  status: z.nativeEnum(BugStatus).optional(),
  notes: z.string().optional().nullable(),
  assignedToDeveloperId: z.string().uuid().optional().nullable()
});

// A Developer may only ever change status and append notes on their own
// bug — everything else (severity, reassignment, title/description) stays
// off the whitelist so the server enforces this even if the UI hides it.
const developerUpdateSchema = z.object({
  status: z.nativeEnum(BugStatus).optional(),
  notes: z.string().optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const skip = (pagination.page - 1) * pagination.pageSize;

  if (req.user!.role === UserRole.DEVELOPER) {
    const profile = await prisma.developerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) {
      res.json(toPage([], 0, pagination));
      return;
    }
    const where = { assignedToDeveloperId: profile.id };
    const [bugs, total] = await Promise.all([
      prisma.bug.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pagination.pageSize }),
      prisma.bug.count({ where })
    ]);
    res.json(toPage(bugs, total, pagination));
    return;
  }

  const [bugs, total] = await Promise.all([
    prisma.bug.findMany({ orderBy: { createdAt: "desc" }, skip, take: pagination.pageSize }),
    prisma.bug.count()
  ]);
  res.json(toPage(bugs, total, pagination));
});

router.patch("/:id", async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }

  const isManager = managerRoles.includes(req.user!.role);

  if (isManager) {
    const parsed = managerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid bug data", details: parsed.error.flatten() });
      return;
    }
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === BugStatus.RESOLVED && bug.status !== BugStatus.RESOLVED) {
      data.resolvedAt = new Date();
    }
    const updated = await prisma.bug.update({ where: { id: req.params.id }, data });
    res.json(updated);
    return;
  }

  const profile = await prisma.developerProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile || bug.assignedToDeveloperId !== profile.id) {
    res.status(403).json({ error: "You can only update bugs assigned to you" });
    return;
  }

  const parsed = developerUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid bug data", details: parsed.error.flatten() });
    return;
  }

  const disallowedFields = Object.keys(req.body ?? {}).filter(
    (key) => !["status", "notes"].includes(key)
  );
  if (disallowedFields.length > 0) {
    res.status(403).json({ error: `Developers cannot modify: ${disallowedFields.join(", ")}` });
    return;
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === BugStatus.RESOLVED && bug.status !== BugStatus.RESOLVED) {
    data.resolvedAt = new Date();
  }
  const updated = await prisma.bug.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

router.delete("/:id", requireRole(...managerRoles), async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }
  await prisma.bug.delete({ where: { id: req.params.id } });
  await recordAuditLog({
    actorUserId: req.user!.id,
    action: "BUG_DELETED",
    entityType: "Bug",
    entityId: req.params.id,
    metadata: { title: bug.title, projectId: bug.projectId }
  });
  res.status(204).send();
});

export default router;
