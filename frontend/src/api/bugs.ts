import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Bug } from "./types";

export function useMyBugs() {
  return useQuery({
    queryKey: ["bugs", "mine"],
    queryFn: () => apiFetch<Bug[]>("/api/bugs")
  });
}

export function useUpdateBug(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch<Bug>(`/api/bugs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bugs"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    }
  });
}

export function useDeleteBug(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/bugs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bugs"] });
      if (projectId) queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    }
  });
}
