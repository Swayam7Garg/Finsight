"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type { UserResponse, UpdateProfileInput, ApiResponse } from "@wealthwise/shared-types";

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserResponse>>("/auth/me");
      return res.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { update } = useSession();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await apiClient.patch<ApiResponse<UserResponse>>("/auth/me", data);
      return res.data;
    },
    onSuccess: async (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      // Refresh the NextAuth session so sidebar/topnav pick up changes
      await update({
        name: updatedUser.name,
        currency: updatedUser.currency,
      });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      });
    },
  });
}
