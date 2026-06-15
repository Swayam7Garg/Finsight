"use client";

import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, Gauge, Lightbulb } from "lucide-react";
import { useFinancialHealthScore } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const gradeTone: Record<string, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-lime-500 text-white",
  C: "bg-amber-500 text-white",
  D: "bg-orange-500 text-white",
  F: "bg-red-500 text-white",
};

const statusTone: Record<string, string> = {
  excellent: "text-emerald-600 dark:text-emerald-400",
  good: "text-emerald-600 dark:text-emerald-400",
  fair: "text-sky-600 dark:text-sky-400",
  watch: "text-amber-600 dark:text-amber-400",
  at_risk: "text-orange-600 dark:text-orange-400",
  critical: "text-red-600 dark:text-red-400",
  needs_data: "text-muted-foreground",
};

const priorityTone: Record<string, string> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function FinancialHealthPageClient() {
  const { data, isLoading, isError, error } = useFinancialHealthScore();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Score</h1>
          <p className="text-muted-foreground">We could not load your Financial Health Score.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <CircleAlert className="h-10 w-10 text-destructive" />
            <p className="font-medium">Unable to load score</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again shortly."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Score</h1>
          <p className="text-muted-foreground">
            A read-only score based on your cash flow, budgets, goals, and tracking consistency.
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/analytics">
            View analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Financial Health Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <span className="text-6xl font-bold tracking-tight">{data.score}</span>
              <span className="pb-2 text-xl text-muted-foreground">/100</span>
              <Badge className={cn("mb-3 ml-auto px-3 py-1 text-sm", gradeTone[data.grade])}>
                Grade {data.grade}
              </Badge>
            </div>
            <Progress value={data.score} className="mt-6 h-3" />
            <p className="mt-4 text-sm text-muted-foreground">
              Calculated from your latest 90-day financial activity and current budgets and goals.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown</CardTitle>
            <CardDescription>How each signal contributes to the total score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.breakdown.map((item) => {
              const value = item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0;
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {item.score}/{item.maxScore}
                      </p>
                      <p className={cn("text-xs capitalize", statusTone[item.status])}>
                        {item.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Recommendations
          </CardTitle>
          <CardDescription>Actions that can improve or preserve your score.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {data.recommendations.map((recommendation) => (
              <div
                key={recommendation.key}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <p className="font-medium">{recommendation.title}</p>
                  </div>
                  <Badge variant={priorityTone[recommendation.priority] as "destructive" | "secondary" | "outline"}>
                    {recommendation.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href="/budgets" label="Review budgets" />
        <QuickLink href="/goals" label="Update goals" />
        <QuickLink href="/transactions" label="Track transactions" />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="outline" asChild className="h-12 justify-between">
      <Link href={href}>
        <span className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {label}
        </span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
