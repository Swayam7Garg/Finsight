"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  AccountResponse,
  CreateAccountInput,
  UpdateAccountInput,
  ApiResponse,
} from "@wealthwise/shared-types";

export const accountKeys = {
  all: ["accounts"] as const,
  lists: () => [...accountKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...accountKeys.lists(), filters] as const,
  details: () => [...accountKeys.all, "detail"] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AccountResponse[]>>("/accounts");
      return res.data;
    },
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AccountResponse>>(`/accounts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountInput) => {
      const res = await apiClient.post<ApiResponse<AccountResponse>>("/accounts", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Account created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create account", {
        description: error.message,
      });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountInput }) => {
      const res = await apiClient.patch<ApiResponse<AccountResponse>>(`/accounts/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({
        queryKey: accountKeys.detail(variables.id),
      });
      toast.success("Account updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update account", {
        description: error.message,
      });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<null>>(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Account deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete account", {
        description: error.message,
      });
    },
  });
}
