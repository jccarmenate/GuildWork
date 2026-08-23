import type { ReactNode } from "react";
import type { BugStatus, Priority, ProjectStatus, Severity, UserRole } from "../api/types";

type BadgeColor = "slate" | "blue" | "amber" | "orange" | "emerald" | "red" | "violet";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  orange: "bg-orange-100 text-orange-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-700"
};

interface BadgeProps {
  color: BadgeColor;
  children: ReactNode;
  bold?: boolean;
}

function Badge({ color, children, bold }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${bold ? "font-semibold" : "font-medium"} ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  );
}

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, BadgeColor> = {
  PLANNING: "slate",
  ACTIVE: "blue",
  ON_HOLD: "amber",
  COMPLETED: "emerald",
  CANCELLED: "red"
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge color={PROJECT_STATUS_COLORS[status]}>{PROJECT_STATUS_LABELS[status] ?? status}</Badge>;
}

const LEVEL_LABELS: Record<Priority | Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

const LEVEL_COLORS: Record<Priority | Severity, BadgeColor> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "orange",
  CRITICAL: "red"
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge color={LEVEL_COLORS[priority]} bold={priority === "CRITICAL"}>
      {LEVEL_LABELS[priority] ?? priority}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge color={LEVEL_COLORS[severity]} bold={severity === "CRITICAL"}>
      {LEVEL_LABELS[severity] ?? severity}
    </Badge>
  );
}

const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  WONT_FIX: "Won't Fix"
};

const BUG_STATUS_COLORS: Record<BugStatus, BadgeColor> = {
  OPEN: "orange",
  IN_PROGRESS: "blue",
  RESOLVED: "emerald",
  WONT_FIX: "slate"
};

export function BugStatusBadge({ status }: { status: BugStatus }) {
  return <Badge color={BUG_STATUS_COLORS[status]}>{BUG_STATUS_LABELS[status] ?? status}</Badge>;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  DEVELOPER: "Developer"
};

const ROLE_COLORS: Record<UserRole, BadgeColor> = {
  ADMIN: "violet",
  PROJECT_MANAGER: "blue",
  DEVELOPER: "slate"
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge color={ROLE_COLORS[role]}>{ROLE_LABELS[role] ?? role}</Badge>;
}
