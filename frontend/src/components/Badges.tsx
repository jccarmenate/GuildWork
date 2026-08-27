import type { ReactNode } from "react";
import type { BugStatus, Priority, ProjectStatus, Severity, UserRole } from "../api/types";

type BadgeColor = "slate" | "teal" | "blue" | "amber" | "orange" | "emerald" | "red" | "violet";

// Reads like a classification stamp on a case file rather than a soft pill —
// a small colored mark plus a mono, uppercase label, sitting on a hairline
// border instead of a filled background.
const COLOR_CLASSES: Record<BadgeColor, string> = {
  slate: "border-ink-200 text-ink-500",
  teal: "border-teal-200 text-teal-700",
  blue: "border-sky-200 text-sky-700",
  amber: "border-amber-200 text-amber-700",
  orange: "border-orange-200 text-orange-700",
  emerald: "border-emerald-200 text-emerald-700",
  red: "border-red-200 text-red-700",
  violet: "border-violet-200 text-violet-700"
};

const DOT_CLASSES: Record<BadgeColor, string> = {
  slate: "bg-ink-400",
  teal: "bg-teal-600",
  blue: "bg-sky-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  red: "bg-red-500",
  violet: "bg-violet-500"
};

// Validated (scripts/validate_palette.js) against the parchment surface —
// every adjacent pair clears CVD ΔE ≥ 15 and the 3:1 contrast floor. Shared
// between the Severity badge dot and the bug-severity charts so the same
// four hues mean the same thing everywhere in the app.
export const SEVERITY_CHART_COLORS: Record<Severity, string> = {
  LOW: "#0D9488",
  MEDIUM: "#2563EB",
  HIGH: "#EA580C",
  CRITICAL: "#991B1B"
};

interface BadgeProps {
  color: BadgeColor;
  children: ReactNode;
  bold?: boolean;
  /** Plays the ink-stamp entrance once on mount. Reserved for a badge that
   * stands alone (a page header, a profile card) — a whole table of them
   * stamping in at once reads as noise, not craft. */
  stamp?: boolean;
}

function Badge({ color, children, bold, stamp }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border bg-surface px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${bold ? "font-semibold" : "font-medium"} ${stamp ? "animate-stamp-in" : ""} ${COLOR_CLASSES[color]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[color]}`} aria-hidden="true" />
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

export function ProjectStatusBadge({ status, stamp }: { status: ProjectStatus; stamp?: boolean }) {
  return (
    <Badge color={PROJECT_STATUS_COLORS[status]} stamp={stamp}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

const LEVEL_LABELS: Record<Priority | Severity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

const LEVEL_COLORS: Record<Priority | Severity, BadgeColor> = {
  LOW: "teal",
  MEDIUM: "blue",
  HIGH: "orange",
  CRITICAL: "red"
};

export function PriorityBadge({ priority, stamp }: { priority: Priority; stamp?: boolean }) {
  return (
    <Badge color={LEVEL_COLORS[priority]} bold={priority === "CRITICAL"} stamp={stamp}>
      {LEVEL_LABELS[priority] ?? priority}
    </Badge>
  );
}

export function SeverityBadge({ severity, stamp }: { severity: Severity; stamp?: boolean }) {
  return (
    <Badge color={LEVEL_COLORS[severity]} bold={severity === "CRITICAL"} stamp={stamp}>
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
  return (
    <Badge color={ROLE_COLORS[role]} stamp>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}
