"use client";

import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-analytics";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MonthlySnapshot() {
  const now = new Date();
  const { data: summary, isLoading } = useMonthlySummary(now.getFullYear(), now.getMonth() + 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const income = summary?.totalIncome ?? 0;
  const expenses = summary?.totalExpenses ?? 0;
  const savings = summary?.netSavings ?? 0;
  const maxVal = Math.max(income, expenses, 1);

  const items = [
    {
      label: "Income",
      value: income,
      icon: TrendingUp,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Expenses",
      value: expenses,
      icon: TrendingDown,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Savings",
      value: savings,
      icon: PiggyBank,
      color: "bg-primary",
      textColor: savings >= 0 ? "text-primary" : "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-sm font-medium">Monthly Snapshot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className={cn("h-4 w-4", item.textColor)} />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <span className={cn("text-sm font-semibold", item.textColor)}>
                {formatCurrency(Math.abs(item.value))}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-500", item.color)}
                style={{
                  width: `${Math.min((Math.abs(item.value) / maxVal) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
