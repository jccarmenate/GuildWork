import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useClients } from "../api/clients";
import { useCreateProject, useProjects, type ProjectFilters } from "../api/projects";
import { RoleGuard } from "../components/RoleGuard";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";
import { PriorityBadge, ProjectStatusBadge } from "../components/Badges";
import type { Priority, ProjectStatus } from "../api/types";

const STATUSES: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const clients = useClients({ pageSize: 100 });
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !clientId || !startDate) {
      setError("Name, client, and start date are required.");
      return;
    }
    try {
      await createProject.mutateAsync({ clientId, name, startDate });
      onDone();
    } catch {
      setError("Could not create the project.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select client...</option>
          {clients.data?.items.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={createProject.isPending}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
        >
          Create project
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ProjectsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const projects = useProjects(filters, page);
  const clients = useClients({ enabled: isManager, pageSize: 100 });

  useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </RoleGuard>
      </div>

      {showForm && <NewProjectForm onDone={() => setShowForm(false)} />}

      {isManager && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            placeholder="Search by name..."
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as ProjectStatus }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => setFilters((f) => ({ ...f, priority: (e.target.value || undefined) as Priority }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {clients.data && clients.data.items.length > 0 && (
            <select
              onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value || undefined }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All clients</option>
              {clients.data.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {projects.isLoading ? (
        <Spinner label="Loading projects..." />
      ) : projects.isError ? (
        <p className="text-sm text-red-600">Failed to load projects.</p>
      ) : projects.data?.items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={isManager ? "No projects match these filters" : "You are not assigned to any projects yet"}
          description={
            isManager
              ? "Try adjusting your filters, or click “New Project” above to create one."
              : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.data!.items.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link to={`/projects/${p.id}`} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{p.client?.name ?? "-"}</td>
                      <td className="px-4 py-2">
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-2">
                        <PriorityBadge priority={p.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={projects.data!.page}
            pageSize={projects.data!.pageSize}
            total={projects.data!.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
