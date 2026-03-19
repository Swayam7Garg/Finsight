"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { BudgetSummary, CategoryResponse } from "@wealthwise/shared-types";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface BudgetCardProps {
  budget: BudgetSummary;
  category?: CategoryResponse;
  onEdit: (budget: BudgetSummary) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, category, onEdit, onDelete }: BudgetCardProps) {
  const percentage = Math.min(budget.percentage, 100);
  const statusColor =
    budget.percentage < 70
      ? "text-emerald-600 dark:text-emerald-400"
      : budget.percentage < 90
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const progressColor =
    budget.percentage < 70
      ? "bg-emerald-500"
      : budget.percentage < 90
        ? "bg-amber-500"
        : "bg-red-500";

  const remaining = Math.max(budget.amount - budget.spent, 0);

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
              style={{
                backgroundColor: category ? `${category.color}20` : "#6366f120",
              }}
            >
              {category?.icon ?? "📊"}
            </div>
            <div>
              <h3 className="text-sm font-semibold">{category?.name ?? "Unknown"}</h3>
              <p className="text-xs capitalize text-muted-foreground">{budget.period}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(budget)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(budget.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-lg font-bold">{formatCurrency(budget.spent)}</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              / {formatCurrency(budget.amount)}
            </span>
          </div>
          <span className={cn("text-sm font-semibold", statusColor)}>
            {Math.round(budget.percentage)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", progressColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {remaining > 0 ? (
            <>
              <span className="font-medium text-foreground">{formatCurrency(remaining)}</span>{" "}
              remaining
            </>
          ) : (
            <span className="font-medium text-red-600 dark:text-red-400">
              Over budget by {formatCurrency(budget.spent - budget.amount)}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
