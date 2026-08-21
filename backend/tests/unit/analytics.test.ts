import { beforeEach, describe, expect, it } from "vitest";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.js";
import { Priority, ProjectStatus, Severity } from "@prisma/client";
import {
  bugSeverityBreakdown,
  projectCompletion,
  skillCoverage,
  topPerformers
} from "../../src/analytics/queries.js";

beforeEach(() => {
  resetPrismaMock();
});

describe("bugSeverityBreakdown", () => {
  it("groups by severity, counts, and averages resolution time in hours", async () => {
    const base = new Date("2026-01-01T00:00:00Z");
    prismaMock.bug.findMany.mockResolvedValue([
      { severity: Severity.HIGH, createdAt: base, resolvedAt: new Date("2026-01-01T02:00:00Z") },
      { severity: Severity.HIGH, createdAt: base, resolvedAt: new Date("2026-01-01T04:00:00Z") },
      { severity: Severity.LOW, createdAt: base, resolvedAt: null }
    ] as never);

    const result = await bugSeverityBreakdown(prismaMock);

    const high = result.find((r) => r.severity === Severity.HIGH)!;
    expect(high.count).toBe(2);
    expect(high.avgResolutionHours).toBe(3);

    const low = result.find((r) => r.severity === Severity.LOW)!;
    expect(low.count).toBe(1);
    expect(low.avgResolutionHours).toBeNull();
  });
});

describe("projectCompletion", () => {
  it("computes completion rate by client and by priority from hand-computable fixtures", async () => {
    prismaMock.project.findMany.mockResolvedValue([
      { status: ProjectStatus.COMPLETED, priority: Priority.HIGH, clientId: "c1", client: { name: "Client A" } },
      { status: ProjectStatus.ACTIVE, priority: Priority.HIGH, clientId: "c1", client: { name: "Client A" } },
      { status: ProjectStatus.COMPLETED, priority: Priority.LOW, clientId: "c2", client: { name: "Client B" } }
    ] as never);

    const result = await projectCompletion(prismaMock);

    const clientA = result.byClient.find((c) => c.clientId === "c1")!;
    expect(clientA.total).toBe(2);
    expect(clientA.completionRate).toBe(0.5);

    const clientB = result.byClient.find((c) => c.clientId === "c2")!;
    expect(clientB.completionRate).toBe(1);

    const high = result.byPriority.find((p) => p.priority === Priority.HIGH)!;
    expect(high.total).toBe(2);
    expect(high.completionRate).toBe(0.5);
  });
});

describe("skillCoverage", () => {
  it("surfaces gaps where active-project demand exceeds developer supply", async () => {
    prismaMock.skill.findMany.mockResolvedValue([
      {
        id: "s1",
        name: "Rust",
        developerSkills: [{}],
        projectSkills: [
          { project: { status: ProjectStatus.ACTIVE } },
          { project: { status: ProjectStatus.ACTIVE } },
          { project: { status: ProjectStatus.COMPLETED } }
        ]
      }
    ] as never);

    const result = await skillCoverage(prismaMock);

    expect(result[0].developersWithSkill).toBe(1);
    expect(result[0].activeProjectsRequiring).toBe(2);
    expect(result[0].gap).toBe(1);
  });
});

describe("topPerformers", () => {
  it("ranks developers by resolved HIGH+CRITICAL bug count", async () => {
    prismaMock.developerProfile.findMany.mockResolvedValue([
      {
        id: "d1",
        user: { name: "Ada" },
        bugsAssigned: [
          { severity: Severity.CRITICAL, status: "RESOLVED", createdAt: new Date(0), resolvedAt: new Date(3600 * 1000) },
          { severity: Severity.HIGH, status: "RESOLVED", createdAt: new Date(0), resolvedAt: new Date(3600 * 1000) },
          { severity: Severity.LOW, status: "RESOLVED", createdAt: new Date(0), resolvedAt: new Date(3600 * 1000) }
        ]
      },
      {
        id: "d2",
        user: { name: "Grace" },
        bugsAssigned: [{ severity: Severity.HIGH, status: "RESOLVED", createdAt: new Date(0), resolvedAt: new Date(7200 * 1000) }]
      }
    ] as never);

    const result = await topPerformers(prismaMock, 5);

    expect(result[0].name).toBe("Ada");
    expect(result[0].resolvedHighSeverityCount).toBe(2);
    expect(result[1].name).toBe("Grace");
    expect(result[1].resolvedHighSeverityCount).toBe(1);
  });
});
