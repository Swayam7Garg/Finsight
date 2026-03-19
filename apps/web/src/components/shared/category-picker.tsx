"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { CategoryResponse } from "@wealthwise/shared-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryPickerProps {
  categories: CategoryResponse[];
  value?: string;
  onSelect: (categoryId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  filterType?: "income" | "expense";
  className?: string;
}

export function CategoryPicker({
  categories,
  value,
  onSelect,
  placeholder = "Select category...",
  disabled = false,
  filterType,
  className,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);

  const filteredCategories = filterType
    ? categories.filter((c) => c.type === filterType)
    : categories;

  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-base leading-none">{selectedCategory.icon}</span>
              <span className="truncate">{selectedCategory.name}</span>
              <span
                className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>

            {/* Group by type */}
            {["expense", "income"].map((type) => {
              const groupCategories = filteredCategories.filter((c) => c.type === type);
              if (groupCategories.length === 0) return null;

              return (
                <CommandGroup key={type} heading={type === "income" ? "Income" : "Expense"}>
                  {groupCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={`${category.name}-${category.id}`}
                      onSelect={() => {
                        onSelect(category.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center gap-2.5">
                        <span className="text-base leading-none">{category.icon}</span>
                        <span>{category.name}</span>
                        <span
                          className="ml-auto h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === category.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
