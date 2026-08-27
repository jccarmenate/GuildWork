import { useState, type FormEvent } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from "../api/clients";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";
import type { Client } from "../api/types";

export function ClientsPage() {
  const [page, setPage] = useState(1);
  const clients = useClients({ page });
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    await createClient.mutateAsync({ name, industry: industry || null, contactName: null, contactEmail: null });
    setName("");
    setIndustry("");
  }

  function startRename(client: Client) {
    setEditingId(client.id);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">Clients</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-col gap-2 rounded-lg border border-line bg-surface p-5 shadow-sm sm:flex-row sm:flex-wrap"
      >
        <input
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
        />
        <input
          placeholder="Industry (optional)"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-md bg-brass-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:scale-[1.02] hover:bg-brass-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add client
        </button>
      </form>

      {clients.isLoading ? (
        <Spinner label="Loading clients..." />
      ) : clients.data?.items.length === 0 ? (
        <EmptyState icon={Building2} title="No clients yet" description="Add your first client using the form above." />
      ) : (
        <>
        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-parchment text-ink-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Industry</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {clients.data!.items.map((c) => (
                  <tr key={c.id} className="border-t border-line transition-colors duration-150 hover:bg-parchment">
                    <td className="px-4 py-2">
                      {editingId === c.id ? (
                        <input
                          defaultValue={c.name}
                          onBlur={(e) => {
                            updateClient.mutate({ id: c.id, data: { name: e.target.value } });
                            setEditingId(null);
                          }}
                          autoFocus
                          className="rounded-md border border-line px-2 py-1 text-sm focus:border-brass-500 focus:outline-none focus:ring-1 focus:ring-brass-500"
                        />
                      ) : (
                        <button
                          onClick={() => startRename(c)}
                          className="font-medium text-brass-600 transition-colors duration-150 hover:text-brass-700 hover:underline"
                        >
                          {c.name}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-ink-500">{c.industry ?? "-"}</td>
                    <td className="px-4 py-2 text-ink-500">{c.contactName ?? "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => deleteClient.mutate(c.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination page={clients.data!.page} pageSize={clients.data!.pageSize} total={clients.data!.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
