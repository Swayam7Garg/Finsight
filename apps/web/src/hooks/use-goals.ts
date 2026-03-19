"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  GoalResponse,
  CreateGoalInput,
  UpdateGoalInput,
  AddFundsInput,
  ApiResponse,
} from "@wealthwise/shared-types";

export const goalKeys = {
  all: ["goals"] as const,
  lists: () => [...goalKeys.all, "list"] as const,
  details: () => [...goalKeys.all, "detail"] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
};

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.lists(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<GoalResponse[]>>("/goals");
      return res.data;
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGoalInput) => {
      const res = await apiClient.post<ApiResponse<GoalResponse>>("/goals", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      toast.success("Goal created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create goal", {
        description: error.message,
      });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGoalInput }) => {
      const res = await apiClient.patch<ApiResponse<GoalResponse>>(`/goals/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(variables.id),
      });
      toast.success("Goal updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update goal", {
        description: error.message,
      });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<null>>(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      toast.success("Goal deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete goal", {
        description: error.message,
      });
    },
  });
}

export function useAddFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddFundsInput }) => {
      const res = await apiClient.post<ApiResponse<GoalResponse>>(`/goals/${id}/add-funds`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(variables.id),
      });
      toast.success("Funds added successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to add funds", {
        description: error.message,
      });
    },
  });
}
