"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBudgetSchema, updateBudgetSchema } from "@wealthwise/shared-types";
import type { CreateBudgetInput, UpdateBudgetInput, BudgetSummary } from "@wealthwise/shared-types";
import { useCreateBudget, useUpdateBudget } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetSummary | null;
}

export function BudgetForm({ open, onOpenChange, budget }: BudgetFormProps) {
  const isEdit = !!budget;
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { data: categories } = useCategories();

  const expenseCategories = categories?.filter((c) => c.type === "expense");

  const form = useForm<CreateBudgetInput>({
    resolver: zodResolver(isEdit ? updateBudgetSchema : createBudgetSchema),
    defaultValues: {
      categoryId: budget?.categoryId ?? "",
      amount: budget?.amount ?? 0,
      period: budget?.period ?? "monthly",
      alertThreshold: budget?.alertThreshold ?? 0.8,
    },
  });

  async function onSubmit(data: CreateBudgetInput) {
    if (isEdit && budget) {
      await updateBudget.mutateAsync({
        id: budget.id,
        data: data as UpdateBudgetInput,
      });
    } else {
      await createBudget.mutateAsync(data);
    }
    form.reset();
    onOpenChange(false);
  }

  const alertThreshold = form.watch("alertThreshold");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Budget" : "Create Budget"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your budget settings." : "Set a spending limit for a category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("categoryId")}
              onValueChange={(value) => form.setValue("categoryId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an expense category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label>Period</Label>
            <Select
              value={form.watch("period")}
              onValueChange={(value) =>
                form.setValue("period", value as CreateBudgetInput["period"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alert Threshold Slider */}
          <div className="space-y-2">
            <Label>
              Alert Threshold:{" "}
              <span className="font-semibold">{Math.round((alertThreshold ?? 0.8) * 100)}%</span>
            </Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={alertThreshold ?? 0.8}
              onChange={(e) => form.setValue("alertThreshold", parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              You'll be alerted when spending reaches this percentage of your budget.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBudget.isPending || updateBudget.isPending}>
              {createBudget.isPending || updateBudget.isPending
                ? "Saving..."
                : isEdit
                  ? "Update Budget"
                  : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
