import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import request from "supertest";
import { UserRole, Severity, BugStatus } from "@prisma/client";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/auth/tokens.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

beforeEach(() => {
  resetPrismaMock();
});

const app = createApp();

const adminToken = signAccessToken({ sub: "admin-1", email: "admin@example.com", role: UserRole.ADMIN });
const devToken = signAccessToken({ sub: "dev-user-1", email: "dev@example.com", role: UserRole.DEVELOPER });
const otherDevToken = signAccessToken({ sub: "dev-user-2", email: "dev2@example.com", role: UserRole.DEVELOPER });

const assignedBug = {
  id: "bug-1",
  projectId: "project-1",
  title: "Checkout broken",
  description: null,
  severity: Severity.MEDIUM,
  status: BugStatus.OPEN,
  reportedByUserId: "pm-1",
  assignedToDeveloperId: "dev-profile-1",
  createdAt: new Date(),
  resolvedAt: null
};

const fakeAttachment = {
  id: "att-1",
  bugId: "bug-1",
  uploadedByUserId: "admin-1",
  filename: "screenshot.png",
  mimeType: "image/png",
  size: 3,
  data: Buffer.from([1, 2, 3]),
  createdAt: new Date(),
  uploadedBy: { id: "admin-1", name: "Admin" }
};

describe("POST /api/bugs/:id/attachments", () => {
  it("Admin can upload an attachment", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bugAttachment.create.mockResolvedValue({
      id: fakeAttachment.id,
      filename: fakeAttachment.filename,
      mimeType: fakeAttachment.mimeType,
      size: fakeAttachment.size,
      createdAt: fakeAttachment.createdAt,
      uploadedBy: fakeAttachment.uploadedBy
    } as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/attachments")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", Buffer.from([1, 2, 3]), { filename: "screenshot.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.filename).toBe("screenshot.png");
    expect(res.body.data).toBeUndefined();
  });

  it("Developer is blocked (403) from uploading to a bug not assigned to them", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "different-profile", userId: "dev-user-2" } as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/attachments")
      .set("Authorization", `Bearer ${otherDevToken}`)
      .attach("file", Buffer.from([1, 2, 3]), { filename: "screenshot.png", contentType: "image/png" });

    expect(res.status).toBe(403);
    expect(prismaMock.bugAttachment.create).not.toHaveBeenCalled();
  });

  it("rejects a disallowed file type", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);

    const res = await request(app)
      .post("/api/bugs/bug-1/attachments")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", Buffer.from("#!/bin/sh"), { filename: "script.sh", contentType: "application/x-sh" });

    expect(res.status).toBe(400);
    expect(prismaMock.bugAttachment.create).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    const oversized = Buffer.alloc(6 * 1024 * 1024, 1);

    const res = await request(app)
      .post("/api/bugs/bug-1/attachments")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", oversized, { filename: "huge.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(prismaMock.bugAttachment.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/bugs/:id/attachments", () => {
  it("lists attachment metadata without the file bytes", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bugAttachment.findMany.mockResolvedValue([
      { id: "att-1", filename: "screenshot.png", mimeType: "image/png", size: 3, createdAt: new Date(), uploadedBy: { id: "admin-1", name: "Admin" } }
    ] as never);

    const res = await request(app).get("/api/bugs/bug-1/attachments").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const selectArg = prismaMock.bugAttachment.findMany.mock.calls[0][0] as { select: Record<string, unknown> };
    expect(selectArg.select.data).toBeUndefined();
  });
});

describe("GET /api/bugs/:id/attachments/:attachmentId", () => {
  it("streams the file with the right content type", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bugAttachment.findUnique.mockResolvedValue(fakeAttachment as never);

    const res = await request(app)
      .get("/api/bugs/bug-1/attachments/att-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/png");
    expect((res.body as Buffer).length).toBe(3);
  });

  it("returns 404 when the attachment belongs to a different bug", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.bugAttachment.findUnique.mockResolvedValue({ ...fakeAttachment, bugId: "other-bug" } as never);

    const res = await request(app)
      .get("/api/bugs/bug-1/attachments/att-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/bugs/:id/attachments/:attachmentId", () => {
  it("Admin can delete an attachment", async () => {
    prismaMock.bugAttachment.findUnique.mockResolvedValue(fakeAttachment as never);
    prismaMock.bugAttachment.delete.mockResolvedValue(fakeAttachment as never);

    const res = await request(app)
      .delete("/api/bugs/bug-1/attachments/att-1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it("Developer is blocked (403)", async () => {
    const res = await request(app)
      .delete("/api/bugs/bug-1/attachments/att-1")
      .set("Authorization", `Bearer ${devToken}`);

    expect(res.status).toBe(403);
    expect(prismaMock.bugAttachment.delete).not.toHaveBeenCalled();
  });
});
