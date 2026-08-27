import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";
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
  assignedToDeveloperId: z.string().uuid().optional().nullable()
});

// A Developer may only ever change status on their own bug — everything
// else (severity, reassignment, title/description) stays off the whitelist
// so the server enforces this even if the UI hides it. Context now belongs
// on the comment thread, not a single overwritable field.
const developerUpdateSchema = z.object({
  status: z.nativeEnum(BugStatus).optional()
});

const commentSchema = z.object({
  body: z.string().min(1).max(2000)
});

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }
    cb(null, true);
  }
});

// multer's own errors (bad file type, over the size limit) need to become a
// clean 400 here — left to the global error handler they'd just be a 500.
function uploadSingleFile(req: Request, res: Response, next: NextFunction): void {
  upload.single("file")(req, res, (err: unknown) => {
    if (err instanceof MulterError || err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}

async function canAccessBug(
  req: Request,
  bug: { assignedToDeveloperId: string | null }
): Promise<boolean> {
  if (managerRoles.includes(req.user!.role)) return true;
  const profile = await prisma.developerProfile.findUnique({ where: { userId: req.user!.id } });
  return !!profile && bug.assignedToDeveloperId === profile.id;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/["\r\n]/g, "");
}

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

  const disallowedFields = Object.keys(req.body ?? {}).filter((key) => !["status"].includes(key));
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

router.post("/:id/comments", async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }
  if (!(await canAccessBug(req, bug))) {
    res.status(403).json({ error: "You can only comment on bugs assigned to you" });
    return;
  }

  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid comment", details: parsed.error.flatten() });
    return;
  }

  const comment = await prisma.bugComment.create({
    data: { bugId: bug.id, authorUserId: req.user!.id, body: parsed.data.body },
    include: { author: { select: { id: true, name: true } } }
  });
  res.status(201).json(comment);
});

router.get("/:id/comments", async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }
  if (!(await canAccessBug(req, bug))) {
    res.status(403).json({ error: "You can only view comments on bugs assigned to you" });
    return;
  }

  const comments = await prisma.bugComment.findMany({
    where: { bugId: bug.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } }
  });
  res.json(comments);
});

router.post("/:id/attachments", uploadSingleFile, async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }
  if (!(await canAccessBug(req, bug))) {
    res.status(403).json({ error: "You can only attach files to bugs assigned to you" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "A file is required" });
    return;
  }

  const attachment = await prisma.bugAttachment.create({
    data: {
      bugId: bug.id,
      uploadedByUserId: req.user!.id,
      filename: sanitizeFilename(req.file.originalname),
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer
    },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } }
    }
  });
  res.status(201).json(attachment);
});

router.get("/:id/attachments", async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }
  if (!(await canAccessBug(req, bug))) {
    res.status(403).json({ error: "You can only view attachments on bugs assigned to you" });
    return;
  }

  const attachments = await prisma.bugAttachment.findMany({
    where: { bugId: bug.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } }
    }
  });
  res.json(attachments);
});

router.get("/:id/attachments/:attachmentId", async (req, res) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return;
  }
  if (!(await canAccessBug(req, bug))) {
    res.status(403).json({ error: "You can only download attachments on bugs assigned to you" });
    return;
  }

  const attachment = await prisma.bugAttachment.findUnique({ where: { id: req.params.attachmentId } });
  if (!attachment || attachment.bugId !== bug.id) {
    res.status(404).json({ error: "Attachment not found" });
    return;
  }

  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${sanitizeFilename(attachment.filename)}"`);
  res.send(attachment.data);
});

router.delete("/:id/attachments/:attachmentId", requireRole(...managerRoles), async (req, res) => {
  const attachment = await prisma.bugAttachment.findUnique({ where: { id: req.params.attachmentId } });
  if (!attachment || attachment.bugId !== req.params.id) {
    res.status(404).json({ error: "Attachment not found" });
    return;
  }
  await prisma.bugAttachment.delete({ where: { id: attachment.id } });
  res.status(204).send();
});

export default router;
