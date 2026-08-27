import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Page } from "./types";

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; name: string; email: string };
}

export function useAuditLog(page = 1, pageSize = 25) {
  return useQuery({
    queryKey: ["audit-log", page, pageSize],
    queryFn: () => apiFetch<Page<AuditLogEntry>>(`/api/audit-log?page=${page}&pageSize=${pageSize}`)
  });
}
