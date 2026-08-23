import { useState, type FormEvent } from "react";
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from "../api/clients";
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
      <h1 className="mb-4 text-xl font-bold text-slate-900">Clients</h1>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <input
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Industry (optional)"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Add client
        </button>
      </form>

      {clients.isLoading ? (
        <p className="text-sm text-slate-500">Loading clients...</p>
      ) : clients.data?.length === 0 ? (
        <p className="text-sm text-slate-500">No clients yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      <button onClick={() => startRename(c)} className="font-medium text-slate-900 underline">
                        {c.name}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.industry ?? "-"}</td>
                  <td className="px-4 py-2 text-slate-600">{c.contactName ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => deleteClient.mutate(c.id)} className="text-xs text-red-600 underline">
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
