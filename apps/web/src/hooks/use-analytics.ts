"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@wealthwise/shared-types";

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface IncomeVsExpense {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  topCategories: SpendingByCategory[];
}

export interface TrendData {
  month: string;
  income: number;
  expense: number;
  savingsRate: number;
  netWorth: number;
}

export interface NetWorthData {
  date: string;
  amount: number;
}

export interface DayOfWeekSpending {
  day: string;
  total: number;
  count: number;
  average: number;
}

export interface CategoryMonthlyBreakdown {
  months: Record<string, number | string>[];
  categories: string[];
  colors: Record<string, string>;
}

export const analyticsKeys = {
  all: ["analytics"] as const,
  spendingByCategory: (startDate?: string, endDate?: string) =>
    [...analyticsKeys.all, "spending-by-category", startDate, endDate] as const,
  incomeVsExpense: (months?: number) =>
    [...analyticsKeys.all, "income-vs-expense", months] as const,
  monthlySummary: (year?: number, month?: number) =>
    [...analyticsKeys.all, "monthly-summary", year, month] as const,
  trends: (months?: number) => [...analyticsKeys.all, "trends", months] as const,
  netWorth: () => [...analyticsKeys.all, "net-worth"] as const,
  spendingByDayOfWeek: (startDate?: string, endDate?: string) =>
    [...analyticsKeys.all, "spending-by-day-of-week", startDate, endDate] as const,
  categoryMonthlyBreakdown: (months?: number) =>
    [...analyticsKeys.all, "category-monthly-breakdown", months] as const,
};

export function useSpendingByCategory(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: analyticsKeys.spendingByCategory(startDate, endDate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const res = await apiClient.get<ApiResponse<SpendingByCategory[]>>(
        `/analytics/spending-by-category${qs ? `?${qs}` : ""}`
      );
      return res.data;
    },
  });
}

export function useIncomeVsExpense(months: number = 12) {
  return useQuery({
    queryKey: analyticsKeys.incomeVsExpense(months),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<IncomeVsExpense[]>>(
        `/analytics/income-vs-expense?months=${months}`
      );
      return res.data;
    },
  });
}

export function useMonthlySummary(year?: number, month?: number) {
  return useQuery({
    queryKey: analyticsKeys.monthlySummary(year, month),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.set("year", String(year));
      if (month) params.set("month", String(month));
      const qs = params.toString();
      const res = await apiClient.get<ApiResponse<MonthlySummary>>(
        `/analytics/monthly-summary${qs ? `?${qs}` : ""}`
      );
      return res.data;
    },
  });
}

export function useTrends(months: number = 12) {
  return useQuery({
    queryKey: analyticsKeys.trends(months),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TrendData[]>>(
        `/analytics/trends?months=${months}`
      );
      return res.data;
    },
  });
}

export function useNetWorth() {
  return useQuery({
    queryKey: analyticsKeys.netWorth(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<NetWorthData[]>>("/analytics/net-worth");
      return res.data;
    },
  });
}

export function useSpendingByDayOfWeek(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: analyticsKeys.spendingByDayOfWeek(startDate, endDate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const res = await apiClient.get<ApiResponse<DayOfWeekSpending[]>>(
        `/analytics/spending-by-day-of-week${qs ? `?${qs}` : ""}`
      );
      return res.data;
    },
  });
}

export function useCategoryMonthlyBreakdown(months: number = 6) {
  return useQuery({
    queryKey: analyticsKeys.categoryMonthlyBreakdown(months),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CategoryMonthlyBreakdown>>(
        `/analytics/category-monthly-breakdown?months=${months}`
      );
      return res.data;
    },
  });
}
