interface DivergingRow {
  id: string;
  label: string;
  value: number;
  detail?: string;
}

interface DivergingBarListProps {
  rows: DivergingRow[];
  positiveLabel: string;
  negativeLabel: string;
}

// A shortage/surplus gap is a polarity, not a magnitude — the diverging pair
// (warm = positive, cool = negative) around a neutral zero-line says which
// direction matters before the reader even reads the number, the way a
// single bar chart of raw counts can't.
export function DivergingBarList({ rows, positiveLabel, negativeLabel }: DivergingBarListProps) {
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.value)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-ink-400">
        <span>{negativeLabel}</span>
        <span>{positiveLabel}</span>
      </div>
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const widthPct = (Math.abs(row.value) / maxAbs) * 100;
          const isPositive = row.value > 0;
          const isZero = row.value === 0;
          return (
            <li key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <div>
                <p className="truncate text-ink-600">{row.label}</p>
                <div className="mt-1 grid grid-cols-2 items-center gap-0.5">
                  <div className="flex justify-end pr-0.5">
                    {!isPositive && !isZero && (
                      <div className="h-2 rounded-l-full bg-teal-500" style={{ width: `${widthPct}%` }} />
                    )}
                  </div>
                  <div className="relative flex justify-start pl-0.5">
                    <div className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-line" aria-hidden="true" />
                    {isPositive && <div className="h-2 rounded-r-full bg-orange-600" style={{ width: `${widthPct}%` }} />}
                  </div>
                </div>
              </div>
              <span
                className={`w-14 shrink-0 text-right font-mono text-xs font-semibold tabular-nums ${
                  isPositive ? "text-orange-700" : isZero ? "text-ink-400" : "text-teal-700"
                }`}
              >
                {isPositive ? "+" : ""}
                {row.value}
                {row.detail && <span className="ml-1 font-normal text-ink-400">{row.detail}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
