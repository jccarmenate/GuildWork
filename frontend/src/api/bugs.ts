import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Bug, Page } from "./types";

export function useMyBugs(page = 1, pageSize = 25) {
  return useQuery({
    queryKey: ["bugs", "mine", page, pageSize],
    queryFn: () => apiFetch<Page<Bug>>(`/api/bugs?page=${page}&pageSize=${pageSize}`)
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
