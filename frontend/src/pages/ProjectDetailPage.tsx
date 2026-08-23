import { useState } from "react";
import { useParams } from "react-router-dom";
import { Bug as BugIcon, Download, Plus, Trash2, UserMinus, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiFetchBlob } from "../api/client";
import {
  useAddProjectSkill,
  useAssignDeveloper,
  useCreateBug,
  useProject,
  useRemoveProjectSkill,
  useUnassignDeveloper
} from "../api/projects";
import { useDeleteBug, useUpdateBug } from "../api/bugs";
import { useDevelopers, useMyDeveloperProfile } from "../api/developers";
import { useSkills } from "../api/skills";
import { RoleGuard } from "../components/RoleGuard";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { BugStatusBadge, ProjectStatusBadge, PriorityBadge, SeverityBadge } from "../components/Badges";
import type { Bug, Severity } from "../api/types";

function BugRow({ bug, projectId, myDeveloperId }: { bug: Bug; projectId: string; myDeveloperId?: string }) {
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const isMine = bug.assignedToDeveloperId === myDeveloperId;
  const updateBug = useUpdateBug(projectId);
  const deleteBug = useDeleteBug(projectId);
  const [notes, setNotes] = useState(bug.notes ?? "");

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2">{bug.title}</td>
      <td className="px-3 py-2">
        <SeverityBadge severity={bug.severity} />
      </td>
      <td className="px-3 py-2">
        {isManager || isMine ? (
          <select
            value={bug.status}
            onChange={(e) => updateBug.mutate({ id: bug.id, data: { status: e.target.value } })}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <BugStatusBadge status={bug.status} />
        )}
      </td>
      <td className="px-3 py-2">
        {isManager || isMine ? (
          <div className="flex gap-1">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Add a note..."
            />
            <button
              onClick={() => updateBug.mutate({ id: bug.id, data: { notes } })}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              Save
            </button>
          </div>
        ) : (
          bug.notes ?? "-"
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <button
            onClick={() => deleteBug.mutate(bug.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </RoleGuard>
      </td>
    </tr>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const project = useProject(id);
  const myProfile = useMyDeveloperProfile(!isManager);
  const developers = useDevelopers(isManager);
  const skills = useSkills();
  const assignDeveloper = useAssignDeveloper(id ?? "");
  const unassignDeveloper = useUnassignDeveloper(id ?? "");
  const addSkill = useAddProjectSkill(id ?? "");
  const removeSkill = useRemoveProjectSkill(id ?? "");
  const createBug = useCreateBug(id ?? "");
  const [newBugTitle, setNewBugTitle] = useState("");
  const [newBugSeverity, setNewBugSeverity] = useState<Severity>("MEDIUM");
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadReport() {
    if (!id) return;
    setIsDownloading(true);
    try {
      const blob = await apiFetchBlob(`/api/projects/${id}/report.pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${id}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  if (project.isLoading) return <Spinner label="Loading project..." />;
  if (project.isError || !project.data) return <p className="text-sm text-red-600">Project not found.</p>;

  const p = project.data;
  const assignedIds = new Set(p.assignments?.map((a) => a.developerId));
  const requiredSkillIds = new Set(p.requiredSkills?.map((s) => s.skillId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{p.client?.name}</span>
            <span className="text-slate-300">•</span>
            <ProjectStatusBadge status={p.status} />
            <PriorityBadge priority={p.priority} />
          </div>
        </div>
        <button
          onClick={() => void downloadReport()}
          disabled={isDownloading}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Preparing..." : "Download PDF report"}
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Assigned developers</h2>
        <ul className="mb-3 divide-y divide-slate-100">
          {p.assignments?.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {a.developer.user.name} <span className="text-slate-500">({a.roleOnProject ?? "contributor"})</span>
              </span>
              <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                <button
                  onClick={() => unassignDeveloper.mutate(a.developerId)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                  Unassign
                </button>
              </RoleGuard>
            </li>
          ))}
          {p.assignments?.length === 0 && <p className="py-1 text-sm text-slate-500">No developers assigned.</p>}
        </ul>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) assignDeveloper.mutate({ developerId: e.target.value });
              e.target.value = "";
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Assign a developer...</option>
            {developers.data
              ?.filter((d) => !assignedIds.has(d.id))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user.name}
                </option>
              ))}
          </select>
        </RoleGuard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Required skills</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {p.requiredSkills?.map((rs) => (
            <span
              key={rs.id}
              className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
            >
              {rs.skill.name}
              <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                <button
                  onClick={() => removeSkill.mutate(rs.skillId)}
                  className="text-indigo-400 transition-colors duration-150 hover:text-indigo-700"
                  aria-label={`Remove ${rs.skill.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </RoleGuard>
            </span>
          ))}
        </div>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addSkill.mutate(e.target.value);
              e.target.value = "";
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Add a required skill...</option>
            {skills.data
              ?.filter((s) => !requiredSkillIds.has(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </RoleGuard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Bugs</h2>
        </div>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              placeholder="New bug title"
              value={newBugTitle}
              onChange={(e) => setNewBugTitle(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:flex-1"
            />
            <select
              value={newBugSeverity}
              onChange={(e) => setNewBugSeverity(e.target.value as Severity)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!newBugTitle) return;
                createBug.mutate({ title: newBugTitle, severity: newBugSeverity });
                setNewBugTitle("");
              }}
              className="flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add bug
            </button>
          </div>
        </RoleGuard>
        {p.bugs?.length === 0 ? (
          <EmptyState icon={BugIcon} title="No bugs reported" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="px-3 py-1">Title</th>
                  <th className="px-3 py-1">Severity</th>
                  <th className="px-3 py-1">Status</th>
                  <th className="px-3 py-1">Notes</th>
                  <th className="px-3 py-1" />
                </tr>
              </thead>
              <tbody>
                {p.bugs?.map((b) => (
                  <BugRow key={b.id} bug={b} projectId={p.id} myDeveloperId={myProfile.data?.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
