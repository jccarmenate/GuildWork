import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Bug, BugAttachment, BugComment, Page } from "./types";

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

export function useBugComments(bugId: string, enabled = true) {
  return useQuery({
    queryKey: ["bugs", bugId, "comments"],
    queryFn: () => apiFetch<BugComment[]>(`/api/bugs/${bugId}/comments`),
    enabled
  });
}

export function useAddBugComment(bugId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<BugComment>(`/api/bugs/${bugId}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bugs", bugId, "comments"] })
  });
}

export function useBugAttachments(bugId: string, enabled = true) {
  return useQuery({
    queryKey: ["bugs", bugId, "attachments"],
    queryFn: () => apiFetch<BugAttachment[]>(`/api/bugs/${bugId}/attachments`),
    enabled
  });
}

export function useUploadBugAttachment(bugId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.set("file", file);
      return apiFetch<BugAttachment>(`/api/bugs/${bugId}/attachments`, { method: "POST", body: form });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bugs", bugId, "attachments"] })
  });
}

export function useDeleteBugAttachment(bugId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      apiFetch<void>(`/api/bugs/${bugId}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bugs", bugId, "attachments"] })
  });
}
