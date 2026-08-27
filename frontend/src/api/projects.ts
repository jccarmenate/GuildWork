import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Bug, Page, Priority, Project, ProjectStatus } from "./types";

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: Priority;
  clientId?: string;
  search?: string;
}

function toQueryString(filters: ProjectFilters, page: number, pageSize: number): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.search) params.set("search", filters.search);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `?${params.toString()}`;
}

export function useProjects(filters: ProjectFilters = {}, page = 1, pageSize = 25) {
  return useQuery({
    queryKey: ["projects", filters, page, pageSize],
    queryFn: () => apiFetch<Page<Project>>(`/api/projects${toQueryString(filters, page, pageSize)}`)
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => apiFetch<Project>(`/api/projects/${id}`),
    enabled: !!id
  });
}

type ProjectInput = {
  clientId: string;
  name: string;
  description?: string | null;
  priority?: Priority;
  status?: ProjectStatus;
  budget?: number | null;
  startDate: string;
  endDate?: string | null;
};

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectInput) =>
      apiFetch<Project>("/api/projects", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectInput> }) =>
      apiFetch<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });
}

export function useAssignDeveloper(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { developerId: string; roleOnProject?: string; hoursAllocated?: number }) =>
      apiFetch(`/api/projects/${projectId}/assignments`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] })
  });
}

export function useUnassignDeveloper(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (developerId: string) =>
      apiFetch(`/api/projects/${projectId}/assignments/${developerId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] })
  });
}

export function useAddProjectSkill(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) =>
      apiFetch(`/api/projects/${projectId}/skills`, { method: "POST", body: JSON.stringify({ skillId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] })
  });
}

export function useRemoveProjectSkill(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => apiFetch(`/api/projects/${projectId}/skills/${skillId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] })
  });
}

export function useCreateBug(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; severity?: string; assignedToDeveloperId?: string }) =>
      apiFetch<Bug>(`/api/projects/${projectId}/bugs`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", projectId] })
  });
}
