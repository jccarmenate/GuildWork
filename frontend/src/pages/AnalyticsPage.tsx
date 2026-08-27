import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import type { Priority } from "../api/types";

const CHART_COLOR = "#96662A";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-ink-600">{title}</h2>
      {children}
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Analytics</h1>

      <Panel title="Bug severity breakdown">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bugSeverity.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E1D9C6" />
            <XAxis dataKey="severity" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} animationDuration={500} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Developer workload">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-500">
              <tr>
                <th className="py-1">Developer</th>
                <th className="py-1">Active assignments</th>
                <th className="py-1">Open bugs</th>
              </tr>
            </thead>
            <tbody>
              {workload.data?.map((row) => (
                <tr key={row.developerId} className="border-t border-line">
                  <td className="py-1.5">{row.name}</td>
                  <td className="py-1.5">{row.activeAssignments}</td>
                  <td className="py-1.5">{row.openBugs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Mentorship">
        {mentorship.data?.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No mentorships set up yet" />
        ) : (
          <ul className="space-y-2 text-sm">
            {mentorship.data?.map((m) => (
              <li key={m.mentorId}>
                <span className="font-medium text-ink">{m.mentorName}</span>
                <ul className="ml-4 list-disc text-ink-500">
                  {m.mentees.map((mentee) => (
                    <li key={mentee.developerId}>
                      {mentee.name} — {mentee.resolvedBugCount} bugs resolved
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Project completion rate">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase text-ink-500">By client</h3>
            <ul className="text-sm text-ink-600">
              {completion.data?.byClient.map((c) => (
                <li key={c.clientId}>
                  {c.clientName}: {Math.round(c.completionRate * 100)}% ({c.total} projects)
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase text-ink-500">By priority</h3>
            <ul className="space-y-1.5 text-sm text-ink-600">
              {completion.data?.byPriority.map((p) => (
                <li key={p.priority} className="flex items-center gap-2">
                  <PriorityBadge priority={p.priority as Priority} />
                  <span>
                    {Math.round(p.completionRate * 100)}% ({p.total} projects)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel title="Skill coverage">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-500">
              <tr>
                <th className="py-1">Skill</th>
                <th className="py-1">Developers</th>
                <th className="py-1">Active projects requiring</th>
                <th className="py-1">Gap</th>
              </tr>
            </thead>
            <tbody>
              {skillCoverage.data?.map((row) => (
                <tr key={row.skillId} className="border-t border-line">
                  <td className="py-1.5">{row.name}</td>
                  <td className="py-1.5">{row.developersWithSkill}</td>
                  <td className="py-1.5">{row.activeProjectsRequiring}</td>
                  <td className={`py-1.5 font-medium ${row.gap > 0 ? "text-red-600" : "text-ink-500"}`}>{row.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Top performers">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-500">
              <tr>
                <th className="py-1">Developer</th>
                <th className="py-1">High/critical bugs resolved</th>
                <th className="py-1">Avg. resolution (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.data?.map((row) => (
                <tr key={row.developerId} className="border-t border-line">
                  <td className="py-1.5">{row.name}</td>
                  <td className="py-1.5">{row.resolvedHighSeverityCount}</td>
                  <td className="py-1.5">{row.avgResolutionHours ? row.avgResolutionHours.toFixed(1) : "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
