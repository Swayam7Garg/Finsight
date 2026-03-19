"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { transactionKeys } from "./use-transactions";
import { accountKeys } from "./use-accounts";
import type {
  RecurringResponse,
  CreateRecurringInput,
  UpdateRecurringInput,
  ApiResponse,
} from "@wealthwise/shared-types";

export const recurringKeys = {
  all: ["recurring"] as const,
  lists: () => [...recurringKeys.all, "list"] as const,
  upcoming: () => [...recurringKeys.all, "upcoming"] as const,
  details: () => [...recurringKeys.all, "detail"] as const,
  detail: (id: string) => [...recurringKeys.details(), id] as const,
};

export function useRecurringRules() {
  return useQuery({
    queryKey: recurringKeys.lists(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<RecurringResponse[]>>("/recurring");
      return res.data;
    },
  });
}

export function useUpcomingBills() {
  return useQuery({
    queryKey: recurringKeys.upcoming(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<RecurringResponse[]>>("/recurring/upcoming");
      return res.data;
    },
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecurringInput) => {
      const res = await apiClient.post<ApiResponse<RecurringResponse>>("/recurring", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      toast.success("Recurring rule created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create recurring rule", {
        description: error.message,
      });
    },
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecurringInput }) => {
      const res = await apiClient.patch<ApiResponse<RecurringResponse>>(`/recurring/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      queryClient.invalidateQueries({
        queryKey: recurringKeys.detail(variables.id),
      });
      toast.success("Recurring rule updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update recurring rule", {
        description: error.message,
      });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<null>>(`/recurring/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      toast.success("Recurring rule deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete recurring rule", {
        description: error.message,
      });
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<ApiResponse<RecurringResponse>>(
        `/recurring/${id}/mark-paid`,
        {}
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Payment recorded successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to record payment", {
        description: error.message,
      });
    },
  });
}
