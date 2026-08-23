import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useClients } from "../api/clients";
import { useCreateProject, useProjects, type ProjectFilters } from "../api/projects";
import { RoleGuard } from "../components/RoleGuard";
import type { Priority, ProjectStatus } from "../api/types";

const STATUSES: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const clients = useClients();
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
    <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select client...</option>
          {clients.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createProject.isPending}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create project
        </button>
        <button type="button" onClick={onDone} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
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
  const [showForm, setShowForm] = useState(false);
  const projects = useProjects(filters);
  const clients = useClients(isManager);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Projects</h1>
        <RoleGuard allow={["ADMIN", "PROJECT_MANAGER"]}>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New Project
          </button>
        </RoleGuard>
      </div>

      {showForm && <NewProjectForm onDone={() => setShowForm(false)} />}

      {isManager && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            placeholder="Search by name..."
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as ProjectStatus }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {clients.data && clients.data.length > 0 && (
            <select
              onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value || undefined }))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All clients</option>
              {clients.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {projects.isLoading ? (
        <p className="text-sm text-slate-500">Loading projects...</p>
      ) : projects.isError ? (
        <p className="text-sm text-red-600">Failed to load projects.</p>
      ) : projects.data?.length === 0 ? (
        <p className="text-sm text-slate-500">
          {isManager ? "No projects match these filters." : "You are not assigned to any projects yet."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
              {projects.data!.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link to={`/projects/${p.id}`} className="font-medium text-slate-900 underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.client?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{p.status}</td>
                  <td className="px-4 py-2 text-slate-600">{p.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
