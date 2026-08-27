import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";

vi.mock("../../src/lib/prisma.js", () => ({ prisma: prismaMock }));
const { sendEmailMock } = vi.hoisted(() => ({ sendEmailMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../src/lib/email.js", () => ({ sendEmail: sendEmailMock }));

import { notifyBugAssigned, notifyBugResolved } from "../../src/lib/notifications.js";

beforeEach(() => {
  resetPrismaMock();
  sendEmailMock.mockClear();
});

describe("notifyBugAssigned", () => {
  it("emails the assigned developer", async () => {
    prismaMock.developerProfile.findUnique.mockResolvedValue({
      id: "dev-profile-1",
      user: { email: "dev@example.com", name: "Dev" }
    } as never);

    await notifyBugAssigned({ developerId: "dev-profile-1", bugTitle: "Checkout broken", bugSeverity: "HIGH" });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "dev@example.com" })
    );
  });

  it("does nothing when the developer profile no longer exists", async () => {
    prismaMock.developerProfile.findUnique.mockResolvedValue(null);

    await notifyBugAssigned({ developerId: "gone", bugTitle: "Checkout broken", bugSeverity: "HIGH" });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("notifyBugResolved", () => {
  it("emails the bug's reporter", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "pm@example.com", name: "PM" } as never);

    await notifyBugResolved({ reporterUserId: "pm-1", bugTitle: "Checkout broken" });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "pm@example.com" })
    );
  });

  it("does nothing when the reporter no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await notifyBugResolved({ reporterUserId: "gone", bugTitle: "Checkout broken" });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
