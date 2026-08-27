import { useState } from "react";
import { History } from "lucide-react";
import { useAuditLog } from "../api/auditLog";
import { EmptyState } from "../components/EmptyState";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";

const ACTION_LABELS: Record<string, string> = {
  USER_ROLE_CHANGED: "Role changed",
  PROJECT_DELETED: "Project deleted",
  PROJECT_RESTORED: "Project restored",
  CLIENT_DELETED: "Client deleted",
  CLIENT_RESTORED: "Client restored",
  BUG_DELETED: "Bug deleted"
};

function describe(entry: { action: string; metadata: Record<string, unknown> | null }): string {
  const m = entry.metadata ?? {};
  switch (entry.action) {
    case "USER_ROLE_CHANGED":
      return `${String(m.from ?? "?")} → ${String(m.to ?? "?")}`;
    case "PROJECT_DELETED":
    case "PROJECT_RESTORED":
    case "CLIENT_DELETED":
    case "CLIENT_RESTORED":
      return String(m.name ?? "");
    case "BUG_DELETED":
      return String(m.title ?? "");
    default:
      return "";
  }
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const auditLog = useAuditLog(page);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink">Audit log</h1>
      <p className="mb-4 text-sm text-ink-500">Role changes and destructive actions across GuildWork, most recent first.</p>

      {auditLog.isLoading ? (
        <Spinner label="Loading audit log..." />
      ) : auditLog.data?.items.length === 0 ? (
        <EmptyState icon={History} title="No audited activity yet" />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-parchment text-ink-500">
                  <tr>
                    <th className="px-4 py-2">When</th>
                    <th className="px-4 py-2">Actor</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.data!.items.map((entry) => (
                    <tr key={entry.id} className="border-t border-line">
                      <td className="whitespace-nowrap px-4 py-2 text-ink-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-ink-600">{entry.actor.name}</td>
                      <td className="px-4 py-2 font-medium text-ink">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </td>
                      <td className="px-4 py-2 text-ink-500">{describe(entry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={auditLog.data!.page}
            pageSize={auditLog.data!.pageSize}
            total={auditLog.data!.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
