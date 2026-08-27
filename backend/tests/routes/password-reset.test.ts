import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));
const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/lib/email.js", () => ({ sendEmail: sendEmailMock }));

import request from "supertest";
import { UserRole } from "@prisma/client";
import { createApp } from "../../src/app.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

beforeEach(() => {
  resetPrismaMock();
  sendEmailMock.mockClear();
});

const app = createApp();

describe("POST /api/auth/forgot-password", () => {
  it("creates a reset token and emails the link for a known email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "dev@example.com",
      name: "Dev",
      role: UserRole.DEVELOPER,
      passwordHash: "hash",
      createdAt: new Date()
    } as never);
    prismaMock.passwordResetToken.create.mockResolvedValue({} as never);

    const res = await request(app).post("/api/auth/forgot-password").send({ email: "dev@example.com" });

    expect(res.status).toBe(202);
    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" })
      })
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "dev@example.com" })
    );
  });

  it("returns the same generic response for an unknown email (no enumeration)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@example.com" });

    expect(res.status).toBe(202);
    expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/reset-password", () => {
  it("updates the password and revokes existing sessions for a valid token", async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue({
      id: "prt-1",
      userId: "user-1",
      tokenHash: "irrelevant-because-mocked",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      usedAt: null,
      createdAt: new Date()
    } as never);
    prismaMock.user.update.mockResolvedValue({} as never);
    prismaMock.passwordResetToken.update.mockResolvedValue({} as never);
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 2 } as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "raw-token-value", password: "NewPassword123!" });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
    expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "prt-1" }, data: expect.objectContaining({ usedAt: expect.any(Date) }) })
    );
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", revokedAt: null } })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "PASSWORD_RESET", actorUserId: "user-1" }) })
    );
  });

  it("rejects an unknown or already-used token with a generic 400", async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "bogus", password: "NewPassword123!" });

    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    prismaMock.passwordResetToken.findFirst.mockResolvedValue({
      id: "prt-1",
      userId: "user-1",
      tokenHash: "x",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      createdAt: new Date()
    } as never);

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "raw-token-value", password: "NewPassword123!" });

    expect(res.status).toBe(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
