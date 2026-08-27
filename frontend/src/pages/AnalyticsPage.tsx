import { GraduationCap } from "lucide-react";
import {
  useBugSeverityAnalytics,
  useMentorshipAnalytics,
  useProjectCompletionAnalytics,
  useSkillCoverageAnalytics,
  useTopPerformersAnalytics,
  useWorkloadAnalytics
} from "../api/analytics";
import { EmptyState } from "../components/EmptyState";
import { PriorityBadge } from "../components/Badges";
import { SeverityBarChart } from "../components/charts/SeverityBarChart";
import { Meter } from "../components/Meter";
import { DivergingBarList } from "../components/DivergingBarList";
import type { Priority } from "../api/types";

function Panel({
  title,
  description,
  span,
  delay = 0,
  children
}: {
  title: string;
  description?: string;
  span?: "full";
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in-up rounded-lg border border-line bg-surface p-6 shadow-sm ${span === "full" ? "lg:col-span-2" : ""}`}
    >
      <h2 className="text-sm font-semibold text-ink-600">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-ink-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AnalyticsPage() {
  const bugSeverity = useBugSeverityAnalytics();
  const workload = useWorkloadAnalytics();
  const mentorship = useMentorshipAnalytics();
  const completion = useProjectCompletionAnalytics();
  const skillCoverage = useSkillCoverageAnalytics();
  const topPerformers = useTopPerformersAnalytics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-500">A ledger of how the guild is doing — load, coverage, and who's carrying what.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Bugs by severity" delay={0}>
          <SeverityBarChart data={bugSeverity.data} />
        </Panel>

        <Panel title="Top performers" description="Ranked by high/critical bugs resolved" delay={60}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-2 font-medium">Developer</th>
                  <th className="pb-2 text-right font-medium">Resolved</th>
                  <th className="pb-2 text-right font-medium">Avg. hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topPerformers.data?.map((row, i) => (
                  <tr key={row.developerId}>
                    <td className="py-2 text-ink-600">
                      <span className="mr-2 font-mono text-xs text-ink-400">{String(i + 1).padStart(2, "0")}</span>
                      {row.name}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-ink">{row.resolvedHighSeverityCount}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-ink-500">
                      {row.avgResolutionHours ? row.avgResolutionHours.toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Project completion" description="Share of a group's projects marked Completed" span="full" delay={120}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-ink-400">By client</h3>
              {completion.data?.byClient.map((c) => (
                <Meter key={c.clientId} label={c.clientName} value={c.completionRate} detail={`${c.total} projects`} />
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-ink-400">By priority</h3>
              {completion.data?.byPriority.map((p) => (
                <div key={p.priority} className="flex items-center gap-3">
                  <PriorityBadge priority={p.priority as Priority} />
                  <div className="flex-1">
                    <Meter label="" value={p.completionRate} detail={`${p.total} projects`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Skill coverage" description="Active projects requiring a skill, minus developers who have it" delay={180}>
          <DivergingBarList
            rows={
              skillCoverage.data?.map((row) => ({
                id: row.skillId,
                label: row.name,
                value: row.gap,
                detail: `(${row.developersWithSkill}/${row.activeProjectsRequiring})`
              })) ?? []
            }
            positiveLabel="Shortage"
            negativeLabel="Surplus"
          />
        </Panel>

        <Panel title="Developer workload" delay={240}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-2 font-medium">Developer</th>
                  <th className="pb-2 text-right font-medium">Active</th>
                  <th className="pb-2 text-right font-medium">Open bugs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {workload.data?.map((row) => (
                  <tr key={row.developerId}>
                    <td className="py-2 text-ink-600">{row.name}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-ink">{row.activeAssignments}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-ink">{row.openBugs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Mentorship" span="full" delay={300}>
          {mentorship.data?.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No mentorships set up yet" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentorship.data?.map((m) => (
                <div key={m.mentorId} className="rounded-md border border-line p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <GraduationCap className="h-3.5 w-3.5 text-brass-600" />
                    {m.mentorName}
                  </p>
                  <ul className="mt-2 space-y-1 border-l border-line pl-3 text-xs text-ink-500">
                    {m.mentees.map((mentee) => (
                      <li key={mentee.developerId}>
                        {mentee.name} <span className="text-ink-400">— {mentee.resolvedBugCount} resolved</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
