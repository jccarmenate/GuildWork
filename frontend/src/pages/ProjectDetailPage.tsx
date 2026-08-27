import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Bug as BugIcon,
  ChevronDown,
  ChevronRight,
  Download,
  Paperclip,
  Plus,
  Send,
  Trash2,
  UserMinus,
  X
} from "lucide-react";
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
import {
  useAddBugComment,
  useBugAttachments,
  useBugComments,
  useDeleteBug,
  useDeleteBugAttachment,
  useUpdateBug,
  useUploadBugAttachment
} from "../api/bugs";
import { useDevelopers, useMyDeveloperProfile } from "../api/developers";
import { useSkills } from "../api/skills";
import { RoleGuard } from "../components/RoleGuard";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { BugStatusBadge, ProjectStatusBadge, PriorityBadge, SeverityBadge } from "../components/Badges";
import type { Bug, Severity } from "../api/types";

const SEVERITY_STRIPE: Record<Severity, string> = {
  LOW: "border-l-ink-200",
  MEDIUM: "border-l-sky-400",
  HIGH: "border-l-orange-400",
  CRITICAL: "border-l-red-500"
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BugDetailsPanel({ bug, canParticipate }: { bug: Bug; canParticipate: boolean }) {
  const comments = useBugComments(bug.id);
  const attachments = useBugAttachments(bug.id);
  const addComment = useAddBugComment(bug.id);
  const uploadAttachment = useUploadBugAttachment(bug.id);
  const deleteAttachment = useDeleteBugAttachment(bug.id);
  const [commentBody, setCommentBody] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function downloadAttachment(attachmentId: string, filename: string) {
    const blob = await apiFetchBlob(`/api/bugs/${bug.id}/attachments/${attachmentId}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Comments</h3>
        {comments.isLoading ? (
          <Spinner label="Loading comments..." />
        ) : (
          <ul className="mb-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {comments.data?.map((c) => (
              <li key={c.id} className="rounded-md bg-parchment px-3 py-2 text-sm">
                <div className="mb-0.5 flex items-center justify-between text-xs text-ink-500">
                  <span className="font-medium text-ink-600">{c.author.name}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-ink-600">{c.body}</p>
              </li>
            ))}
            {comments.data?.length === 0 && <p className="text-sm text-ink-500">No comments yet.</p>}
          </ul>
        )}
        {canParticipate && (
          <div className="flex gap-1.5">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Add a comment..."
              rows={1}
              className="flex-1 resize-none rounded-md border border-line px-2 py-1.5 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
            />
            <button
              onClick={() => {
                if (!commentBody.trim()) return;
                addComment.mutate(commentBody, { onSuccess: () => setCommentBody("") });
              }}
              disabled={addComment.isPending}
              className="flex items-center gap-1 rounded-md bg-brass-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-brass-700 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              Post
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Attachments</h3>
        <ul className="mb-3 space-y-1.5">
          {attachments.data?.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md bg-parchment px-3 py-1.5 text-sm">
              <button
                onClick={() => void downloadAttachment(a.id, a.filename)}
                className="flex items-center gap-1.5 truncate text-left text-brass-600 hover:text-brass-700 hover:underline"
                title={a.filename}
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a.filename}</span>
              </button>
              <span className="ml-2 flex items-center gap-2 shrink-0 text-xs text-ink-400">
                {formatBytes(a.size)}
                <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                  <button
                    onClick={() => deleteAttachment.mutate(a.id)}
                    aria-label={`Delete ${a.filename}`}
                    className="text-ink-400 transition-colors duration-150 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </RoleGuard>
              </span>
            </li>
          ))}
          {attachments.data?.length === 0 && <p className="text-sm text-ink-500">No attachments yet.</p>}
        </ul>
        {canParticipate && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAttachment.mutate(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hidden"
              id={`attachment-input-${bug.id}`}
            />
            <label
              htmlFor={`attachment-input-${bug.id}`}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors duration-150 hover:bg-parchment"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {uploadAttachment.isPending ? "Uploading..." : "Attach a file"}
            </label>
            {uploadAttachment.isError && (
              <p className="mt-1 text-xs text-red-600">Could not upload that file (max 5 MB, images or PDF).</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BugRow({ bug, projectId, myDeveloperId }: { bug: Bug; projectId: string; myDeveloperId?: string }) {
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const isMine = bug.assignedToDeveloperId === myDeveloperId;
  const canParticipate = isManager || isMine;
  const updateBug = useUpdateBug(projectId);
  const deleteBug = useDeleteBug(projectId);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className={`border-t border-line border-l-[3px] ${SEVERITY_STRIPE[bug.severity]}`}>
        <td className="px-3 py-2">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-left font-medium text-ink hover:text-brass-600"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {bug.title}
          </button>
        </td>
        <td className="px-3 py-2">
          <SeverityBadge severity={bug.severity} />
        </td>
        <td className="px-3 py-2">
          {canParticipate ? (
            <select
              value={bug.status}
              onChange={(e) => updateBug.mutate({ id: bug.id, data: { status: e.target.value } })}
              className="rounded-md border border-line px-2 py-1 text-xs focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
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
      {isExpanded && (
        <tr className="border-t border-line bg-surface">
          <td colSpan={4} className="p-0">
            <BugDetailsPanel bug={bug} canParticipate={canParticipate} />
          </td>
        </tr>
      )}
    </>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const project = useProject(id);
  const myProfile = useMyDeveloperProfile(!isManager);
  const developers = useDevelopers({ enabled: isManager, pageSize: 100 });
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
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-500">
            <span>{p.client?.name}</span>
            <span className="text-ink-200">•</span>
            <ProjectStatusBadge status={p.status} />
            <PriorityBadge priority={p.priority} />
          </div>
        </div>
        <button
          onClick={() => void downloadReport()}
          disabled={isDownloading}
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-600 transition-colors duration-150 hover:bg-parchment disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Preparing..." : "Download PDF report"}
        </button>
      </div>

      <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-600">Assigned developers</h2>
        <ul className="mb-3 divide-y divide-line">
          {p.assignments?.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {a.developer.user.name} <span className="text-ink-500">({a.roleOnProject ?? "contributor"})</span>
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
          {p.assignments?.length === 0 && <p className="py-1 text-sm text-ink-500">No developers assigned.</p>}
        </ul>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) assignDeveloper.mutate({ developerId: e.target.value });
              e.target.value = "";
            }}
            className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
          >
            <option value="">Assign a developer...</option>
            {developers.data?.items
              .filter((d) => !assignedIds.has(d.id))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user.name}
                </option>
              ))}
          </select>
        </RoleGuard>
      </section>

      <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink-600">Required skills</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {p.requiredSkills?.map((rs) => (
            <span
              key={rs.id}
              className="flex items-center gap-1.5 rounded-full bg-brass-50 px-3 py-1 text-xs font-medium text-brass-700"
            >
              {rs.skill.name}
              <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
                <button
                  onClick={() => removeSkill.mutate(rs.skillId)}
                  className="text-brass-400 transition-colors duration-150 hover:text-brass-700"
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
            className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
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

      <section className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-600">Bugs</h2>
        </div>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              placeholder="New bug title"
              value={newBugTitle}
              onChange={(e) => setNewBugTitle(e.target.value)}
              className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500 sm:flex-1"
            />
            <select
              value={newBugSeverity}
              onChange={(e) => setNewBugSeverity(e.target.value as Severity)}
              className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
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
              className="flex items-center justify-center gap-1.5 rounded-md bg-brass-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-brass-700 active:scale-[0.98]"
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
              <thead className="text-ink-500">
                <tr>
                  <th className="px-3 py-1">Title</th>
                  <th className="px-3 py-1">Severity</th>
                  <th className="px-3 py-1">Status</th>
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
