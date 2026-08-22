import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { DeveloperProfile, Proficiency } from "./types";

export function useDevelopers(enabled = true) {
  return useQuery({
    queryKey: ["developers"],
    queryFn: () => apiFetch<DeveloperProfile[]>("/api/developers"),
    enabled
  });
}

export function useMyDeveloperProfile(enabled = true) {
  return useQuery({
    queryKey: ["developers", "me"],
    queryFn: () => apiFetch<DeveloperProfile>("/api/developers/me"),
    enabled
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bio?: string | null }) =>
      apiFetch<DeveloperProfile>("/api/developers/me", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developers", "me"] })
  });
}

export function useUpdateDeveloperProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { seniority?: string; mentorId?: string | null; bio?: string | null } }) =>
      apiFetch<DeveloperProfile>(`/api/developers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developers"] })
  });
}

export function useAddMySkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { skillId: string; proficiency?: Proficiency }) =>
      apiFetch("/api/developers/me/skills", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developers", "me"] })
  });
}

export function useRemoveMySkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => apiFetch(`/api/developers/me/skills/${skillId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developers", "me"] })
  });
}
