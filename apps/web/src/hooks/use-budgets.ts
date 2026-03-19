"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  BudgetResponse,
  BudgetSummary,
  CreateBudgetInput,
  UpdateBudgetInput,
  ApiResponse,
} from "@wealthwise/shared-types";

export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  summary: () => [...budgetKeys.all, "summary"] as const,
  details: () => [...budgetKeys.all, "detail"] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BudgetResponse[]>>("/budgets");
      return res.data;
    },
  });
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: budgetKeys.summary(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BudgetSummary[]>>("/budgets/summary");
      return res.data;
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBudgetInput) => {
      const res = await apiClient.post<ApiResponse<BudgetResponse>>("/budgets", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      toast.success("Budget created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create budget", {
        description: error.message,
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBudgetInput }) => {
      const res = await apiClient.patch<ApiResponse<BudgetResponse>>(`/budgets/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({
        queryKey: budgetKeys.detail(variables.id),
      });
      toast.success("Budget updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update budget", {
        description: error.message,
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<null>>(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      toast.success("Budget deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete budget", {
        description: error.message,
      });
    },
  });
}
