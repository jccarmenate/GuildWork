import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, Bug as BugIcon, FolderKanban, Gauge, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useBugSeverityAnalytics, useProjectCompletionAnalytics, useTopPerformersAnalytics } from "../api/analytics";
import { useMyDeveloperProfile } from "../api/developers";
import { useMyBugs } from "../api/bugs";
import { useProjects } from "../api/projects";
import { StatTile } from "../components/StatTile";
import { EmptyState } from "../components/EmptyState";
import { BugStatusBadge, ProjectStatusBadge, SeverityBadge } from "../components/Badges";

const CHART_COLOR = "#4f46e5";

function ManagerDashboard() {
  const bugSeverity = useBugSeverityAnalytics();
  const completion = useProjectCompletionAnalytics();
  const topPerformers = useTopPerformersAnalytics();

  const totalBugs = bugSeverity.data?.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const avgCompletionByPriority = completion.data?.byPriority ?? [];
  const overallCompletion =
    avgCompletionByPriority.length > 0
      ? avgCompletionByPriority.reduce((sum, r) => sum + r.completionRate, 0) / avgCompletionByPriority.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Total bugs tracked" value={totalBugs} icon={BugIcon} tint="amber" />
        <StatTile label="Avg. completion rate" value={`${Math.round(overallCompletion * 100)}%`} icon={Gauge} tint="emerald" />
        <StatTile label="Top performers tracked" value={topPerformers.data?.length ?? 0} icon={Award} tint="indigo" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Bugs by severity</h2>
        {bugSeverity.isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bugSeverity.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="severity" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Top performers</h2>
        {topPerformers.isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (topPerformers.data?.length ?? 0) === 0 ? (
          <EmptyState icon={Award} title="No resolved high-severity bugs yet" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1">Developer</th>
                <th className="py-1">High/critical bugs resolved</th>
                <th className="py-1">Avg. resolution (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.data!.map((row) => (
                <tr key={row.developerId} className="border-t border-slate-100">
                  <td className="py-1.5">{row.name}</td>
                  <td className="py-1.5">{row.resolvedHighSeverityCount}</td>
                  <td className="py-1.5">{row.avgResolutionHours ? row.avgResolutionHours.toFixed(1) : "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DeveloperDashboard() {
  const profile = useMyDeveloperProfile();
  const bugs = useMyBugs();
  const projects = useProjects();

  const openBugs = bugs.data?.filter((b) => b.status === "OPEN" || b.status === "IN_PROGRESS") ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Assigned projects" value={projects.data?.length ?? 0} icon={FolderKanban} tint="indigo" />
        <StatTile label="Open bugs" value={openBugs.length} icon={BugIcon} tint="amber" />
        <StatTile label="Skills logged" value={profile.data?.skills.length ?? 0} icon={Sparkles} tint="violet" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Your assigned projects</h2>
        {projects.isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : projects.data?.length === 0 ? (
          <EmptyState icon={FolderKanban} title="You are not assigned to any projects yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {projects.data!.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-900">{p.name}</span>
                <ProjectStatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Your open bugs</h2>
        {openBugs.length === 0 ? (
          <EmptyState icon={BugIcon} title="No open bugs assigned to you" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {openBugs.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-900">{b.title}</span>
                <span className="flex items-center gap-2">
                  <SeverityBadge severity={b.severity} />
                  <BugStatusBadge status={b.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Your mentor</h2>
        {profile.data?.mentor ? (
          <p className="text-sm text-slate-700">{profile.data.mentor.user.name}</p>
        ) : (
          <EmptyState icon={GraduationCap} title="No mentor assigned yet" />
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>
      {isManager ? <ManagerDashboard /> : <DeveloperDashboard />}
    </div>
  );
}
