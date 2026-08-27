import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEVERITY_CHART_COLORS } from "../Badges";
import type { Severity } from "../../api/types";

interface SeverityDatum {
  severity: string;
  count: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: SeverityDatum }[] }) {
  if (!active || !payload?.length) return null;
  const { severity, count } = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-mono uppercase tracking-wide text-ink-500">{severity}</p>
      <p className="mt-0.5 font-semibold text-ink">
        {count} bug{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

// Bars carry the same four validated severity hues used by SeverityBadge, so
// "critical" reads as the same color whether it's a tag or a bar. The axis
// labels are the identity channel — a single-series bar chart needs no
// legend box, per the dataviz form heuristic.
export function SeverityBarChart({ data }: { data: SeverityDatum[] | undefined }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="#E1D9C6" strokeDasharray="0" />
        <XAxis
          dataKey="severity"
          tickLine={false}
          axisLine={{ stroke: "#E1D9C6" }}
          tick={{ fill: "#6B6252", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#9B9382", fontSize: 11 }} width={24} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#E1D9C6", opacity: 0.35 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56} animationDuration={500}>
          {data?.map((entry) => (
            <Cell key={entry.severity} fill={SEVERITY_CHART_COLORS[entry.severity as Severity] ?? "#96662A"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
