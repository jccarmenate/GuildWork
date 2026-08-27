import type { LucideIcon } from "lucide-react";

type StatTint = "brass" | "blue" | "emerald" | "amber" | "violet";

const ICON_CLASSES: Record<StatTint, string> = {
  brass: "bg-brass-100 text-brass-600",
  blue: "bg-sky-100 text-sky-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  violet: "bg-violet-100 text-violet-600"
};

const STRIPE_CLASSES: Record<StatTint, string> = {
  brass: "border-l-brass-500",
  blue: "border-l-sky-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  violet: "border-l-violet-500"
};

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint?: StatTint;
}

export function StatTile({ label, value, icon: Icon, tint = "brass" }: StatTileProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-line border-l-[3px] bg-surface p-5 shadow-sm ${STRIPE_CLASSES[tint]}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ICON_CLASSES[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
        <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{value}</p>
      </div>
    </div>
  );
}
