interface MeterProps {
  label: string;
  value: number;
  detail?: string;
}

// Fill carries the accent, unfilled track is a lighter step of the same
// ramp (brass-100 on parchment) so the state reads across the whole bar,
// not just at the filled edge.
export function Meter({ label, value, detail }: MeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-ink-600">{label}</span>
        <span className="shrink-0 font-mono text-xs text-ink-500">
          {pct}%{detail ? ` · ${detail}` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-brass-100" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-brass-500 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
