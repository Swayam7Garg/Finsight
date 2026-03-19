"use client";

import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { TransactionQuery } from "@wealthwise/shared-types";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

interface FilterSidebarProps {
  filters: Partial<TransactionQuery>;
  onFiltersChange: (filters: Partial<TransactionQuery>) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  function updateFilter<K extends keyof TransactionQuery>(
    key: K,
    value: TransactionQuery[K] | undefined
  ) {
    const next = { ...filters };
    if (value === undefined || value === "" || value === "all") {
      delete next[key];
    } else {
      next[key] = value;
    }
    onFiltersChange(next);
  }

  function clearAll() {
    onFiltersChange({ page: 1, limit: filters.limit ?? 20 });
  }

  const hasActiveFilters = !!(
    filters.accountId ||
    filters.categoryId ||
    filters.type ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs">
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Account Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Account
        </Label>
        <Select
          value={filters.accountId ?? "all"}
          onValueChange={(v) => updateFilter("accountId", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Category
        </Label>
        <Select
          value={filters.categoryId ?? "all"}
          onValueChange={(v) => updateFilter("categoryId", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Type
        </Label>
        <Select
          value={filters.type ?? "all"}
          onValueChange={(v) =>
            updateFilter("type", v === "all" ? undefined : (v as TransactionQuery["type"]))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Date Range
        </Label>
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left text-sm font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {filters.startDate
                  ? format(new Date(filters.startDate), "MMM d, yyyy")
                  : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                onSelect={(date) =>
                  updateFilter("startDate", date ? date.toISOString() : undefined)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left text-sm font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {filters.endDate ? format(new Date(filters.endDate), "MMM d, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                onSelect={(date) => updateFilter("endDate", date ? date.toISOString() : undefined)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* Amount Range */}
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Amount Range
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Min"
              className="h-9"
              value={filters.minAmount ?? ""}
              onChange={(e) =>
                updateFilter("minAmount", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max"
              className="h-9"
              value={filters.maxAmount ?? ""}
              onChange={(e) =>
                updateFilter("maxAmount", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
