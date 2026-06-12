"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@finsight/shared-types";

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
      const res = await apiClient.get<ApiResponse<any[]>>(
        `/analytics/spending-by-category${qs ? `?${qs}` : ""}`
      );
      return res.data.map((item: any) => ({
        categoryId: item.categoryId || "unknown",
        categoryName: "Category",
        categoryIcon: "box",
        categoryColor: "#000",
        amount: item.total || 0,
        percentage: 0,
        transactionCount: item.count || 0,
      }));
    },
  });
}

export function useIncomeVsExpense(months: number = 12) {
  return useQuery({
    queryKey: analyticsKeys.incomeVsExpense(months),
    queryFn: async () => {
      // Backend /monthly-summary returns array of { month, income, expense }
      const res = await apiClient.get<ApiResponse<any[]>>(
        `/analytics/monthly-summary?months=${months}`
      );
      return res.data.map((item: any) => ({
        month: item.month,
        income: item.income,
        expense: item.expense,
        net: item.income - item.expense,
      }));
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
      // Backend /income-vs-expense returns { income, expense, net }
      const res = await apiClient.get<ApiResponse<any>>(
        `/analytics/income-vs-expense${qs ? `?${qs}` : ""}`
      );
      const data = res.data || {};
      const totalIncome = data.income || 0;
      const totalExpenses = data.expense || 0;
      const netSavings = data.net || 0;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
      
      return {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactionCount: 0,
        topCategories: [],
      };
    },
  });
}

export function useTrends(months: number = 12) {
  return useQuery({
    queryKey: analyticsKeys.trends(months),
    queryFn: async () => {
      // Backend /spending-trend returns { period, data: [{month, income, expense}], ... }
      const res = await apiClient.get<ApiResponse<any>>(
        `/analytics/spending-trend?period=half_year`
      );
      const items = res.data?.data || [];
      return items.map((item: any) => {
        const inc = item.income || 0;
        const exp = item.expense || 0;
        const savingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
        return {
          month: item.month,
          income: inc,
          expense: exp,
          savingsRate,
          netWorth: 0,
        };
      });
    },
  });
}

export function useNetWorth() {
  return useQuery({
    queryKey: analyticsKeys.netWorth(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any[]>>("/analytics/net-worth");
      return res.data.map((item: any) => ({
        date: item.date,
        amount: item.netWorth || 0,
      }));
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
      const res = await apiClient.get<ApiResponse<any[]>>(
        `/analytics/spending-by-day${qs ? `?${qs}` : ""}`
      );
      return res.data.map((item: any) => ({
        day: item.day,
        total: item.total || 0,
        count: item.count || 0,
        average: item.count > 0 ? item.total / item.count : 0,
      }));
    },
  });
}

export function useCategoryMonthlyBreakdown(months: number = 6) {
  return useQuery({
    queryKey: analyticsKeys.categoryMonthlyBreakdown(months),
    queryFn: async () => {
      // Safe empty object to prevent frontend crash
      return {
        months: [],
        categories: [],
        colors: {}
      };
    },
  });
}
