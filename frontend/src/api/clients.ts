import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Client, Page } from "./types";

export function useClients(options: { enabled?: boolean; page?: number; pageSize?: number } = {}) {
  const { enabled = true, page = 1, pageSize = 25 } = options;
  return useQuery({
    queryKey: ["clients", page, pageSize],
    queryFn: () => apiFetch<Page<Client>>(`/api/clients?page=${page}&pageSize=${pageSize}`),
    enabled
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => apiFetch<Client>(`/api/clients/${id}`),
    enabled: !!id
  });
}

type ClientInput = Omit<Client, "id" | "createdAt">;

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientInput) =>
      apiFetch<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientInput> }) =>
      apiFetch<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });
}
