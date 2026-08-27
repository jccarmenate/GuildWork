import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));

import { recordAuditLog } from "../../src/lib/auditLog.js";

beforeEach(() => {
  resetPrismaMock();
});

describe("recordAuditLog", () => {
  it("writes an audit log row with the given actor, action, entity, and metadata", async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await recordAuditLog({
      actorUserId: "admin-1",
      action: "PROJECT_DELETED",
      entityType: "Project",
      entityId: "project-1",
      metadata: { name: "Storefront Revamp" }
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: "PROJECT_DELETED",
        entityType: "Project",
        entityId: "project-1",
        metadata: { name: "Storefront Revamp" }
      }
    });
  });

  it("defaults metadata to an empty object when not given", async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    await recordAuditLog({
      actorUserId: "admin-1",
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: "user-1"
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ metadata: {} })
    });
  });
});
