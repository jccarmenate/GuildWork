import { Award, Bug as BugIcon, FolderKanban, Gauge, GraduationCap, Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useBugSeverityAnalytics, useProjectCompletionAnalytics, useTopPerformersAnalytics } from "../api/analytics";
import { useMyDeveloperProfile } from "../api/developers";
import { useMyBugs } from "../api/bugs";
import { useProjects } from "../api/projects";
import { StatTile } from "../components/StatTile";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { SeverityBarChart } from "../components/charts/SeverityBarChart";
import { BugStatusBadge, ProjectStatusBadge, SeverityBadge } from "../components/Badges";

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total bugs tracked" value={totalBugs} icon={BugIcon} tint="amber" />
        <StatTile label="Avg. completion rate" value={`${Math.round(overallCompletion * 100)}%`} icon={Gauge} tint="emerald" />
        <StatTile label="Top performers tracked" value={topPerformers.data?.length ?? 0} icon={Award} tint="brass" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="rounded-lg border border-line bg-surface p-6 shadow-sm lg:col-span-3">
          <h2 className="text-sm font-semibold text-ink-600">Bugs by severity</h2>
          <div className="mt-4">{bugSeverity.isLoading ? <Spinner /> : <SeverityBarChart data={bugSeverity.data} />}</div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-600">Top performers</h2>
          <p className="mt-0.5 text-xs text-ink-400">High/critical bugs resolved</p>
          <div className="mt-4">
            {topPerformers.isLoading ? (
              <Spinner />
            ) : (topPerformers.data?.length ?? 0) === 0 ? (
              <EmptyState icon={Award} title="No resolved high-severity bugs yet" />
            ) : (
              <ul className="divide-y divide-line">
                {topPerformers.data!.map((row, i) => (
                  <li key={row.developerId} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-2 text-ink-600">
                      <span className="font-mono text-xs text-ink-400">{String(i + 1).padStart(2, "0")}</span>
                      {row.name}
                    </span>
                    <span className="font-mono tabular-nums text-ink">{row.resolvedHighSeverityCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperDashboard() {
  const profile = useMyDeveloperProfile();
  const bugs = useMyBugs();
  const projects = useProjects();

  const openBugs = bugs.data?.items.filter((b) => b.status === "OPEN" || b.status === "IN_PROGRESS") ?? [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Assigned projects" value={projects.data?.items.length ?? 0} icon={FolderKanban} tint="brass" />
        <StatTile label="Open bugs" value={openBugs.length} icon={BugIcon} tint="amber" />
        <StatTile label="Skills logged" value={profile.data?.skills.length ?? 0} icon={Sparkles} tint="violet" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-600">Your assigned projects</h2>
        {projects.isLoading ? (
          <Spinner />
        ) : !projects.data || projects.data.items.length === 0 ? (
          <EmptyState icon={FolderKanban} title="You are not assigned to any projects yet" />
        ) : (
          <ul className="divide-y divide-line">
            {projects.data!.items.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-ink">{p.name}</span>
                <ProjectStatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-600">Your open bugs</h2>
        {openBugs.length === 0 ? (
          <EmptyState icon={BugIcon} title="No open bugs assigned to you" />
        ) : (
          <ul className="divide-y divide-line">
            {openBugs.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-ink">{b.title}</span>
                <span className="flex items-center gap-2">
                  <SeverityBadge severity={b.severity} />
                  <BugStatusBadge status={b.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-600">Your mentor</h2>
        {profile.data?.mentor ? (
          <p className="text-sm text-ink-600">{profile.data.mentor.user.name}</p>
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
      <h1 className="mb-6 text-2xl font-bold text-ink">Dashboard</h1>
      {isManager ? <ManagerDashboard /> : <DeveloperDashboard />}
    </div>
  );
}
