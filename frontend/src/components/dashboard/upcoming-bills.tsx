"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { ArrowRight, Clock } from "lucide-react";
import { useUpcomingBills } from "@/hooks/use-recurring";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingBills() {
  const { data: upcoming, isLoading } = useUpcomingBills();
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const bills = useMemo(() => (upcoming ?? []).slice(0, 5), [upcoming]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
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
        <CardDescription className="text-sm font-medium">Upcoming Bills</CardDescription>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/recurring">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No upcoming bills.</p>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => {
              const cat = categoryMap.get(bill.categoryId);
              const daysUntil = differenceInDays(new Date(bill.nextDueDate), new Date());
              return (
                <div key={bill.id} className="flex items-center justify-between py-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                      {cat?.icon ?? "📋"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{bill.description}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {daysUntil === 0
                          ? "Due today"
                          : daysUntil === 1
                            ? "Due tomorrow"
                            : `Due in ${daysUntil} days`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "ml-3 whitespace-nowrap text-sm font-semibold",
                      bill.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {bill.type === "income" ? "+" : "-"}
                    {formatCurrency(bill.amount)}
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
