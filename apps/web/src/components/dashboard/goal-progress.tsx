"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { useGoals } from "@/hooks/use-goals";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function GoalProgress() {
  const { data: goals, isLoading } = useGoals();

  const topGoal = useMemo(() => {
    const active = goals?.filter((g) => !g.isCompleted) ?? [];
    if (active.length === 0) return null;
    return active.reduce((best, g) => {
      const bestPct = best.currentAmount / best.targetAmount;
      const gPct = g.currentAmount / g.targetAmount;
      return gPct > bestPct ? g : best;
    });
  }, [goals]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="mb-2 h-2.5 w-full rounded-full" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!topGoal) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardDescription className="text-sm font-medium">Goal Progress</CardDescription>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link href="/goals">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No active goals yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = Math.min(
    Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100),
    100
  );
  const remaining = Math.max(topGoal.targetAmount - topGoal.currentAmount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">Goal Progress</CardDescription>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/goals">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: `${topGoal.color}20` }}
          >
            {topGoal.icon}
          </div>
          <div>
            <p className="text-sm font-semibold">{topGoal.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(topGoal.currentAmount)} of {formatCurrency(topGoal.targetAmount)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: topGoal.color,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: topGoal.color }}>
              {percentage}%
            </span>
            <span className="text-muted-foreground">{formatCurrency(remaining)} to go</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
