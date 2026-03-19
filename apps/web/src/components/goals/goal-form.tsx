"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { createGoalSchema, updateGoalSchema } from "@wealthwise/shared-types";
import type { CreateGoalInput, UpdateGoalInput, GoalResponse } from "@wealthwise/shared-types";
import { useCreateGoal, useUpdateGoal } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const GOAL_ICONS = [
  "🎯",
  "🏠",
  "✈️",
  "🚗",
  "💰",
  "📱",
  "🎓",
  "💍",
  "🏥",
  "🎉",
  "📚",
  "🏋️",
  "🎮",
  "🍽️",
  "👶",
  "🐕",
];

const GOAL_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalResponse | null;
}

export function GoalForm({ open, onOpenChange, goal }: GoalFormProps) {
  const isEdit = !!goal;
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const form = useForm<CreateGoalInput>({
    resolver: zodResolver(isEdit ? updateGoalSchema : createGoalSchema),
    defaultValues: {
      name: goal?.name ?? "",
      targetAmount: goal?.targetAmount ?? 0,
      currentAmount: goal?.currentAmount ?? 0,
      deadline: goal?.deadline ?? undefined,
      icon: goal?.icon ?? "🎯",
      color: goal?.color ?? "#10b981",
    },
  });

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");
  const selectedDeadline = form.watch("deadline");

  async function onSubmit(data: CreateGoalInput) {
    if (isEdit && goal) {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: data as UpdateGoalInput,
      });
    } else {
      await createGoal.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your savings goal." : "Set a new savings target to work toward."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input id="name" placeholder="e.g. Emergency Fund" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="10,000.00"
                className="pl-7"
                {...form.register("targetAmount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.targetAmount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.targetAmount.message}
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Deadline (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDeadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDeadline ? format(new Date(selectedDeadline), "PPP") : "No deadline set"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDeadline ? new Date(selectedDeadline) : undefined}
                  onSelect={(date) => {
                    form.setValue("deadline", date ? date.toISOString() : undefined);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedDeadline && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => form.setValue("deadline", undefined)}
              >
                Remove deadline
              </Button>
            )}
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => form.setValue("icon", icon)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-all hover:scale-105",
                    selectedIcon === icon
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted hover:bg-muted/80"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                    selectedColor === color ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
              {createGoal.isPending || updateGoal.isPending
                ? "Saving..."
                : isEdit
                  ? "Update Goal"
                  : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
