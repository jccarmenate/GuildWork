import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));
const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/lib/email.js", () => ({ sendEmail: sendEmailMock }));

import request from "supertest";
import { UserRole, Priority, ProjectStatus, Severity, BugStatus } from "@prisma/client";
import { createApp } from "../../src/app.js";
import { signAccessToken } from "../../src/auth/tokens.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";

beforeEach(() => {
  resetPrismaMock();
  sendEmailMock.mockClear();
});

const app = createApp();

const adminToken = signAccessToken({ sub: "admin-1", email: "admin@example.com", role: UserRole.ADMIN });
const devToken = signAccessToken({ sub: "dev-user-1", email: "dev@example.com", role: UserRole.DEVELOPER });

const fakeProject = {
  id: "project-1",
  clientId: "client-1",
  name: "Storefront Revamp",
  description: null,
  priority: Priority.HIGH,
  status: ProjectStatus.ACTIVE,
  budget: null,
  startDate: new Date(),
  endDate: null,
  deletedAt: null,
  createdByUserId: "pm-1",
  createdAt: new Date(),
  updatedAt: new Date()
};

const unassignedBug = {
  id: "bug-1",
  projectId: "project-1",
  title: "Checkout broken",
  description: null,
  severity: Severity.HIGH,
  status: BugStatus.OPEN,
  reportedByUserId: "pm-1",
  assignedToDeveloperId: null,
  createdAt: new Date(),
  resolvedAt: null
};

describe("Bug creation notifies the assignee", () => {
  it("emails the developer when a bug is created already assigned to them", async () => {
    prismaMock.project.findFirst.mockResolvedValue(fakeProject as never);
    prismaMock.bug.create.mockResolvedValue({ ...unassignedBug, assignedToDeveloperId: "dev-profile-1" } as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({
      id: "dev-profile-1",
      user: { email: "dev@example.com", name: "Dev" }
    } as never);

    await request(app)
      .post("/api/projects/project-1/bugs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Checkout broken", severity: "HIGH", assignedToDeveloperId: "11111111-1111-1111-1111-111111111111" });

    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "dev@example.com" }));
  });

  it("does not send an email when the bug is created unassigned", async () => {
    prismaMock.project.findFirst.mockResolvedValue(fakeProject as never);
    prismaMock.bug.create.mockResolvedValue(unassignedBug as never);

    await request(app)
      .post("/api/projects/project-1/bugs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Checkout broken", severity: "HIGH" });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("Reassigning a bug notifies the new assignee", () => {
  it("emails the newly assigned developer", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(unassignedBug as never);
    prismaMock.bug.update.mockResolvedValue({ ...unassignedBug, assignedToDeveloperId: "dev-profile-1" } as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({
      id: "dev-profile-1",
      user: { email: "dev@example.com", name: "Dev" }
    } as never);

    await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignedToDeveloperId: "11111111-1111-1111-1111-111111111111" });

    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "dev@example.com" }));
  });

  it("does not send an assignment email when assignedToDeveloperId is left unchanged", async () => {
    prismaMock.bug.findUnique.mockResolvedValue(unassignedBug as never);
    prismaMock.bug.update.mockResolvedValue({ ...unassignedBug, severity: Severity.CRITICAL } as never);

    await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ severity: "CRITICAL" });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("Resolving a bug notifies the reporter", () => {
  it("emails the reporter when a manager resolves the bug", async () => {
    prismaMock.bug.findUnique.mockResolvedValue({ ...unassignedBug, status: BugStatus.OPEN } as never);
    prismaMock.bug.update.mockResolvedValue({ ...unassignedBug, status: BugStatus.RESOLVED } as never);
    prismaMock.user.findUnique.mockResolvedValue({ email: "pm@example.com", name: "PM" } as never);

    await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "RESOLVED" });

    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "pm@example.com" }));
  });

  it("emails the reporter when the assigned developer resolves the bug", async () => {
    const assignedBug = { ...unassignedBug, assignedToDeveloperId: "dev-profile-1", status: BugStatus.OPEN };
    prismaMock.bug.findUnique.mockResolvedValue(assignedBug as never);
    prismaMock.developerProfile.findUnique.mockResolvedValue({ id: "dev-profile-1", userId: "dev-user-1" } as never);
    prismaMock.bug.update.mockResolvedValue({ ...assignedBug, status: BugStatus.RESOLVED } as never);
    prismaMock.user.findUnique.mockResolvedValue({ email: "pm@example.com", name: "PM" } as never);

    await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${devToken}`)
      .send({ status: "RESOLVED" });

    expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({ to: "pm@example.com" }));
  });

  it("does not send a resolved email for a non-resolving status change", async () => {
    prismaMock.bug.findUnique.mockResolvedValue({ ...unassignedBug, status: BugStatus.OPEN } as never);
    prismaMock.bug.update.mockResolvedValue({ ...unassignedBug, status: BugStatus.IN_PROGRESS } as never);

    await request(app)
      .patch("/api/bugs/bug-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "IN_PROGRESS" });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
