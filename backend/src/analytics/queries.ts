import type { PrismaClient, Severity } from "@prisma/client";
import { BugStatus, ProjectStatus } from "@prisma/client";

function avgResolutionHours(bugs: { createdAt: Date; resolvedAt: Date | null }[]): number | null {
  const resolved = bugs.filter((b) => b.resolvedAt);
  if (resolved.length === 0) return null;
  const totalMs = resolved.reduce(
    (sum, b) => sum + (b.resolvedAt!.getTime() - b.createdAt.getTime()),
    0
  );
  return totalMs / resolved.length / (1000 * 60 * 60);
}

export async function bugSeverityBreakdown(prisma: PrismaClient) {
  const bugs = await prisma.bug.findMany({
    select: { severity: true, createdAt: true, resolvedAt: true }
  });
  const bySeverity = new Map<Severity, typeof bugs>();
  for (const bug of bugs) {
    const list = bySeverity.get(bug.severity) ?? [];
    list.push(bug);
    bySeverity.set(bug.severity, list);
  }
  return Array.from(bySeverity.entries()).map(([severity, list]) => ({
    severity,
    count: list.length,
    avgResolutionHours: avgResolutionHours(list)
  }));
}

export async function workload(prisma: PrismaClient) {
  const developers = await prisma.developerProfile.findMany({
    include: {
      user: { select: { id: true, name: true } },
      assignments: { include: { project: { select: { status: true } } } },
      bugsAssigned: { select: { status: true } }
    }
  });

  return developers.map((dev) => ({
    developerId: dev.id,
    name: dev.user.name,
    activeAssignments: dev.assignments.filter((a) => a.project.status === ProjectStatus.ACTIVE).length,
    openBugs: dev.bugsAssigned.filter(
      (b) => b.status === BugStatus.OPEN || b.status === BugStatus.IN_PROGRESS
    ).length
  }));
}

export async function mentorship(prisma: PrismaClient) {
  const mentors = await prisma.developerProfile.findMany({
    where: { mentees: { some: {} } },
    include: {
      user: { select: { name: true } },
      mentees: {
        include: {
          user: { select: { name: true } },
          bugsAssigned: { select: { status: true } }
        }
      }
    }
  });

  return mentors.map((mentor) => ({
    mentorId: mentor.id,
    mentorName: mentor.user.name,
    mentees: mentor.mentees.map((mentee) => ({
      developerId: mentee.id,
      name: mentee.user.name,
      resolvedBugCount: mentee.bugsAssigned.filter((b) => b.status === BugStatus.RESOLVED).length
    }))
  }));
}

export async function projectCompletion(prisma: PrismaClient) {
  const projects = await prisma.project.findMany({
    select: { status: true, priority: true, clientId: true, client: { select: { name: true } } }
  });

  const rate = (list: typeof projects) => {
    const completed = list.filter((p) => p.status === ProjectStatus.COMPLETED).length;
    return list.length === 0 ? 0 : completed / list.length;
  };

  const byClientMap = new Map<string, { clientId: string; clientName: string; projects: typeof projects }>();
  for (const project of projects) {
    const entry = byClientMap.get(project.clientId) ?? {
      clientId: project.clientId,
      clientName: project.client.name,
      projects: []
    };
    entry.projects.push(project);
    byClientMap.set(project.clientId, entry);
  }
  const byClient = Array.from(byClientMap.values()).map((entry) => ({
    clientId: entry.clientId,
    clientName: entry.clientName,
    total: entry.projects.length,
    completionRate: rate(entry.projects)
  }));

  const byPriorityMap = new Map<string, typeof projects>();
  for (const project of projects) {
    const list = byPriorityMap.get(project.priority) ?? [];
    list.push(project);
    byPriorityMap.set(project.priority, list);
  }
  const byPriority = Array.from(byPriorityMap.entries()).map(([priority, list]) => ({
    priority,
    total: list.length,
    completionRate: rate(list)
  }));

  return { byClient, byPriority };
}

export async function skillCoverage(prisma: PrismaClient) {
  const skills = await prisma.skill.findMany({
    include: {
      developerSkills: true,
      projectSkills: { include: { project: { select: { status: true } } } }
    }
  });

  return skills.map((skill) => {
    const demand = skill.projectSkills.filter(
      (ps) => ps.project.status === ProjectStatus.ACTIVE
    ).length;
    const supply = skill.developerSkills.length;
    return {
      skillId: skill.id,
      name: skill.name,
      developersWithSkill: supply,
      activeProjectsRequiring: demand,
      gap: demand - supply
    };
  });
}

export async function topPerformers(prisma: PrismaClient, limit = 5) {
  const developers = await prisma.developerProfile.findMany({
    include: {
      user: { select: { name: true } },
      bugsAssigned: { select: { severity: true, status: true, createdAt: true, resolvedAt: true } }
    }
  });

  const ranked = developers.map((dev) => {
    const resolvedHighSeverity = dev.bugsAssigned.filter(
      (b) =>
        b.status === BugStatus.RESOLVED &&
        (b.severity === "HIGH" || b.severity === "CRITICAL")
    );
    return {
      developerId: dev.id,
      name: dev.user.name,
      resolvedHighSeverityCount: resolvedHighSeverity.length,
      avgResolutionHours: avgResolutionHours(resolvedHighSeverity)
    };
  });

  return ranked
    .sort((a, b) => b.resolvedHighSeverityCount - a.resolvedHighSeverityCount)
    .slice(0, limit);
}
