"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useNetWorth } from "@/hooks/use-analytics";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NetWorthCard() {
  const { data, isLoading } = useNetWorth();

  const { current, change, changePercent, trend } = useMemo(() => {
    if (!data || data.length === 0) {
      return { current: 0, change: 0, changePercent: 0, trend: "flat" as const };
    }
    const curr = data[data.length - 1].amount;
    const prev = data.length >= 2 ? data[data.length - 2].amount : curr;
    const diff = curr - prev;
    const pct = prev === 0 ? 0 : (diff / Math.abs(prev)) * 100;
    const t = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    return {
      current: curr,
      change: diff,
      changePercent: pct,
      trend: t as "up" | "down" | "flat",
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-10 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-[60px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full bg-gradient-to-br from-primary/5 via-background to-background lg:col-span-1">
      <CardHeader className="pb-2">
        <CardDescription className="text-sm font-medium">Net Worth</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{formatCurrency(current)}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
          {trend === "flat" && <Minus className="h-4 w-4 text-muted-foreground" />}
          <span
            className={cn(
              "text-sm font-medium",
              trend === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : trend === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            )}
          >
            {change >= 0 ? "+" : ""}
            {formatCurrency(change)} ({changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(1)}%)
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>

        {/* Sparkline */}
        {data && data.length > 1 && (
          <div className="mt-4 h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={trend === "down" ? "#ef4444" : "#6366f1"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={trend === "down" ? "#ef4444" : "#6366f1"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={trend === "down" ? "#ef4444" : "#6366f1"}
                  strokeWidth={2}
                  fill="url(#sparkGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
