"use client";

import { differenceInDays, format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Plus, Calendar, PartyPopper } from "lucide-react";
import type { GoalResponse } from "@wealthwise/shared-types";
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

interface GoalCardProps {
  goal: GoalResponse;
  onEdit: (goal: GoalResponse) => void;
  onDelete: (id: string) => void;
  onAddFunds: (goal: GoalResponse) => void;
}

export function GoalCard({ goal, onEdit, onDelete, onAddFunds }: GoalCardProps) {
  const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;

  const progressColor =
    percentage >= 100
      ? "bg-emerald-500"
      : percentage >= 70
        ? "bg-primary"
        : percentage >= 40
          ? "bg-amber-500"
          : "bg-primary";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md",
        goal.isCompleted && "ring-2 ring-emerald-500/30"
      )}
    >
      {/* Celebration animation for completed goals */}
      {goal.isCompleted && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-4 top-2 animate-bounce text-lg"
            style={{ animationDelay: "0s", animationDuration: "2s" }}
          >
            <PartyPopper className="h-4 w-4 text-emerald-500" />
          </div>
          <div
            className="absolute right-8 top-3 animate-bounce text-lg"
            style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}
          >
            <PartyPopper className="h-3 w-3 text-amber-500" />
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ backgroundColor: `${goal.color}20` }}
            >
              {goal.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold">{goal.name}</h3>
              {goal.isCompleted && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Completed!
                </span>
              )}
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
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(goal.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold">{formatCurrency(goal.currentAmount)}</span>
            <span className="text-sm text-muted-foreground">
              of {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                progressColor
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: goal.color }}>
              {percentage}%
            </span>
            {remaining > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatCurrency(remaining)} to go
              </span>
            )}
          </div>
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(goal.deadline), "MMM d, yyyy")}
              {daysLeft !== null && daysLeft > 0 && (
                <span className="ml-1 font-medium text-foreground">({daysLeft} days left)</span>
              )}
              {daysLeft !== null && daysLeft <= 0 && !goal.isCompleted && (
                <span className="ml-1 font-medium text-red-600 dark:text-red-400">(overdue)</span>
              )}
            </span>
          </div>
        )}

        {/* Add Funds Button */}
        {!goal.isCompleted && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-full gap-1.5"
            onClick={() => onAddFunds(goal)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Funds
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
