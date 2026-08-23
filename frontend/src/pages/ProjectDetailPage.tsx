import { useState } from "react";
import { useParams } from "react-router-dom";
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
      <td className="px-3 py-2">{bug.severity}</td>
      <td className="px-3 py-2">
        {isManager || isMine ? (
          <select
            value={bug.status}
            onChange={(e) => updateBug.mutate({ id: bug.id, data: { status: e.target.value } })}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            {["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          bug.status
        )}
      </td>
      <td className="px-3 py-2">
        {isManager || isMine ? (
          <div className="flex gap-1">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs"
              placeholder="Add a note..."
            />
            <button
              onClick={() => updateBug.mutate({ id: bug.id, data: { notes } })}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs"
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
          <button onClick={() => deleteBug.mutate(bug.id)} className="text-xs text-red-600 underline">
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

  if (project.isLoading) return <p className="text-sm text-slate-500">Loading project...</p>;
  if (project.isError || !project.data) return <p className="text-sm text-red-600">Project not found.</p>;

  const p = project.data;
  const assignedIds = new Set(p.assignments?.map((a) => a.developerId));
  const requiredSkillIds = new Set(p.requiredSkills?.map((s) => s.skillId));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{p.name}</h1>
          <p className="text-sm text-slate-500">
            {p.client?.name} — {p.status} — {p.priority}
          </p>
        </div>
        <button
          onClick={() => void downloadReport()}
          disabled={isDownloading}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
        >
          {isDownloading ? "Preparing..." : "Download PDF report"}
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
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
                  className="text-xs text-red-600 underline"
                >
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Required skills</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {p.requiredSkills?.map((rs) => (
            <span key={rs.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs">
              {rs.skill.name}
              <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                <button onClick={() => removeSkill.mutate(rs.skillId)} className="text-red-600">
                  x
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Bugs</h2>
        </div>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <div className="mb-3 flex gap-2">
            <input
              placeholder="New bug title"
              value={newBugTitle}
              onChange={(e) => setNewBugTitle(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={newBugSeverity}
              onChange={(e) => setNewBugSeverity(e.target.value as Severity)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Add bug
            </button>
          </div>
        </RoleGuard>
        {p.bugs?.length === 0 ? (
          <p className="text-sm text-slate-500">No bugs reported.</p>
        ) : (
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
        )}
      </section>
    </div>
  );
}
