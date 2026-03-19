"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, formatRelativeDate, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentTransactions() {
  const { data: transactionsData, isLoading } = useTransactions({
    page: 1,
    limit: 5,
    sortBy: "date",
    sortOrder: "desc",
  });
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const transactions = transactionsData?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
        <CardDescription className="text-sm font-medium">Recent Transactions</CardDescription>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/transactions">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No recent transactions.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              return (
                <div key={tx.id} className="flex items-center justify-between py-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                      {cat?.icon ?? "💳"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(tx.date)}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "ml-3 whitespace-nowrap text-sm font-semibold",
                      tx.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : tx.type === "expense"
                          ? "text-red-600 dark:text-red-400"
                          : "text-indigo-600 dark:text-indigo-400"
                    )}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
