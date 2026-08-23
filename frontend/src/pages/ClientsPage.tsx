import { useState, type FormEvent } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from "../api/clients";
import { EmptyState } from "../components/EmptyState";
import type { Client } from "../api/types";

export function ClientsPage() {
  const clients = useClients();
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
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Clients</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          placeholder="Industry (optional)"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add client
        </button>
      </form>

      {clients.isLoading ? (
        <p className="text-sm text-slate-500">Loading clients...</p>
      ) : clients.data?.length === 0 ? (
        <EmptyState icon={Building2} title="No clients yet" description="Add your first client using the form above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Industry</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {clients.data!.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    {editingId === c.id ? (
                      <input
                        defaultValue={c.name}
                        onBlur={(e) => {
                          updateClient.mutate({ id: c.id, data: { name: e.target.value } });
                          setEditingId(null);
                        }}
                        autoFocus
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <button onClick={() => startRename(c)} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                        {c.name}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.industry ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{c.contactName ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteClient.mutate(c.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
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
      )}
    </div>
  );
}
