"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useBudgetSummary } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetHealth() {
  const { data: budgets, isLoading } = useBudgetSummary();
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const topBudgets = useMemo(() => (budgets ?? []).slice(0, 3), [budgets]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
        <CardDescription className="text-sm font-medium">Budget Health</CardDescription>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/budgets">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {topBudgets.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No budgets set up yet.</p>
        ) : (
          <div className="space-y-4">
            {topBudgets.map((budget) => {
              const cat = categoryMap.get(budget.categoryId);
              const pct = Math.min(budget.percentage, 100);
              const barColor =
                budget.percentage < 70
                  ? "bg-emerald-500"
                  : budget.percentage < 90
                    ? "bg-amber-500"
                    : "bg-red-500";
              const textColor =
                budget.percentage < 70
                  ? "text-emerald-600 dark:text-emerald-400"
                  : budget.percentage < 90
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400";

              return (
                <div key={budget.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{cat?.icon ?? "📊"}</span>
                      <span className="font-medium">{cat?.name ?? "Unknown"}</span>
                    </span>
                    <span className={cn("text-xs font-semibold", textColor)}>
                      {Math.round(budget.percentage)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
