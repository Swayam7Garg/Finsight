"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { AccountResponse } from "@wealthwise/shared-types";
import { cn, formatCurrency } from "@/lib/utils";
import { ACCOUNT_TYPES } from "@/lib/constants";
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

interface AccountPickerProps {
  accounts: AccountResponse[];
  value?: string;
  onSelect: (accountId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showBalance?: boolean;
  className?: string;
}

export function AccountPicker({
  accounts,
  value,
  onSelect,
  placeholder = "Select account...",
  disabled = false,
  showBalance = true,
  className,
}: AccountPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === value);

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
          {selectedAccount ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: selectedAccount.color + "20" }}
              >
                {(() => {
                  const config = ACCOUNT_TYPES[selectedAccount.type];
                  const Icon = config?.icon;
                  return Icon ? (
                    <Icon className="h-3 w-3" style={{ color: selectedAccount.color }} />
                  ) : null;
                })()}
              </span>
              <span className="truncate">{selectedAccount.name}</span>
              {showBalance && (
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              {accounts
                .filter((a) => !a.isArchived)
                .map((account) => {
                  const config = ACCOUNT_TYPES[account.type];
                  const Icon = config?.icon;

                  return (
                    <CommandItem
                      key={account.id}
                      value={`${account.name}-${account.id}`}
                      onSelect={() => {
                        onSelect(account.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: account.color + "20" }}
                        >
                          {Icon && (
                            <Icon className="h-3.5 w-3.5" style={{ color: account.color }} />
                          )}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm">{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {config?.label ?? account.type}
                          </span>
                        </div>
                        {showBalance && (
                          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                            {formatCurrency(account.balance, account.currency)}
                          </span>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === account.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
