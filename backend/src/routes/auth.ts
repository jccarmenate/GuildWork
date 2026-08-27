import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../auth/hash.js";
import {
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  generateRefreshToken,
  generateRefreshToken as generateOpaqueToken,
  hashRefreshToken as hashOpaqueToken
} from "../auth/tokens.js";
import { issueTokenPair } from "../auth/issueTokens.js";
import { clearRefreshCookie, setRefreshCookie, REFRESH_COOKIE_NAME } from "../auth/cookies.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { recordAuditLog } from "../lib/auditLog.js";
import { sendEmail } from "../lib/email.js";

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole)
});

const changeRoleSchema = z.object({
  role: z.nativeEnum(UserRole)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

router.post("/register", authRateLimit, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration data", details: parsed.error.flatten() });
    return;
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: UserRole.DEVELOPER }
  });
  await prisma.developerProfile.create({ data: { userId: user.id } });

  const { accessToken, refreshToken } = await issueTokenPair(prisma, user);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

router.post("/login", authRateLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid login data" });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = () => res.status(401).json({ error: "Invalid email or password" });

  if (!user) {
    genericError();
    return;
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    genericError();
    return;
  }

  const { accessToken, refreshToken } = await issueTokenPair(prisma, user);
  setRefreshCookie(res, refreshToken);
  res.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Missing refresh token" });
    return;
  }

  const tokenHash = hashRefreshToken(token);
  const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });

  if (!stored) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  // Reuse of a token that was already rotated out (or explicitly revoked) is
  // the standard signal of token theft: someone replayed a stolen cookie
  // after the legitimate client already rotated past it. Nuke every session
  // for the user rather than just this one.
  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    clearRefreshCookie(res);
    res.status(401).json({ error: "Refresh token reuse detected; all sessions revoked" });
    return;
  }

  if (stored.expiresAt < new Date()) {
    res.status(401).json({ error: "Refresh token expired" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() }
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: refreshTokenExpiry()
    }
  });

  setRefreshCookie(res, newRefreshToken);
  res.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (token) {
    const tokenHash = hashRefreshToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

router.post("/forgot-password", authRateLimit, async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  // Always respond the same way regardless of whether the email exists, so
  // this endpoint can't be used to enumerate registered accounts.
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const rawToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
      }
    });

    const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your GuildWork password",
      text: `Use this link to reset your password (valid for 1 hour): ${resetUrl}`
    });
  }

  res.status(202).json({ message: "If that email is registered, a reset link has been sent." });
});

router.post("/reset-password", authRateLimit, async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reset request" });
    return;
  }

  const tokenHash = hashOpaqueToken(parsed.data.token);
  const stored = await prisma.passwordResetToken.findFirst({ where: { tokenHash } });

  const invalid = !stored || stored.usedAt || stored.expiresAt < new Date();
  if (invalid) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } });

  // A password reset means any session started before the user regained
  // control of their account should not survive it.
  await prisma.refreshToken.updateMany({
    where: { userId: stored.userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  await recordAuditLog({
    actorUserId: stored.userId,
    action: "PASSWORD_RESET",
    entityType: "User",
    entityId: stored.userId
  });

  res.json({ message: "Password updated. Please sign in again." });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.get("/admin/users", requireAuth, requireRole(UserRole.ADMIN), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  });
  res.json(users);
});

router.post("/admin/users", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user data", details: parsed.error.flatten() });
    return;
  }
  const { email, password, name, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name, role } });
  if (role === UserRole.DEVELOPER) {
    await prisma.developerProfile.create({ data: { userId: user.id } });
  }

  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.patch("/admin/users/:id/role", requireAuth, requireRole(UserRole.ADMIN), async (req, res) => {
  const parsed = changeRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: parsed.data.role }
  });

  await recordAuditLog({
    actorUserId: req.user!.id,
    action: "USER_ROLE_CHANGED",
    entityType: "User",
    entityId: updated.id,
    metadata: { from: user.role, to: parsed.data.role }
  });

  if (parsed.data.role === UserRole.DEVELOPER) {
    const profile = await prisma.developerProfile.findUnique({ where: { userId: updated.id } });
    if (!profile) {
      await prisma.developerProfile.create({ data: { userId: updated.id } });
    }
  }

  res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });
});

export default router;
