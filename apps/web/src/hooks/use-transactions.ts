"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { accountKeys } from "./use-accounts";
import type {
  TransactionResponse,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQuery,
  ApiResponse,
  PaginatedResponse,
} from "@wealthwise/shared-types";

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters?: Partial<TransactionQuery>) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  search: (query: string) => [...transactionKeys.all, "search", query] as const,
};

function buildQueryString(filters: Partial<TransactionQuery>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTransactions(filters: Partial<TransactionQuery> = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await apiClient.get<PaginatedResponse<TransactionResponse>>(`/transactions${qs}`);
      return res;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TransactionResponse>>(`/transactions/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const res = await apiClient.post<ApiResponse<TransactionResponse>>("/transactions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create transaction", {
        description: error.message,
      });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionInput }) => {
      const res = await apiClient.patch<ApiResponse<TransactionResponse>>(
        `/transactions/${id}`,
        data
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(variables.id),
      });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update transaction", {
        description: error.message,
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<null>>(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Transaction deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete transaction", {
        description: error.message,
      });
    },
  });
}

export function useImportTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post<ApiResponse<{ imported: number; skipped: number }>>(
        "/transactions/import",
        formData
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      toast.success("Import completed", {
        description: `${data.imported} transactions imported, ${data.skipped} skipped`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to import transactions", {
        description: error.message,
      });
    },
  });
}

export function useSearchTransactions(search: string) {
  return useQuery({
    queryKey: transactionKeys.search(search),
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<TransactionResponse>>(
        `/transactions/search?q=${encodeURIComponent(search)}`
      );
      return res.data;
    },
    enabled: search.length >= 2,
  });
}
