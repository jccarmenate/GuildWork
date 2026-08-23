import type { LucideIcon } from "lucide-react";

type StatTint = "indigo" | "blue" | "emerald" | "amber" | "violet";

const TINT_CLASSES: Record<StatTint, string> = {
  indigo: "bg-indigo-100 text-indigo-600",
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  violet: "bg-violet-100 text-violet-600"
};

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tint?: StatTint;
}

export function StatTile({ label, value, icon: Icon, tint = "indigo" }: StatTileProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${TINT_CLASSES[tint]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
