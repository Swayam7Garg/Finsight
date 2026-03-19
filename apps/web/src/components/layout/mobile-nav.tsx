"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { MOBILE_NAV_ITEMS, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNav() {
  const pathname = usePathname();

  // Items in the "More" dropdown (everything not in main mobile nav)
  const moreItems = NAV_ITEMS.filter((item) => !MOBILE_NAV_ITEMS.some((m) => m.href === item.href));

  return (
    <nav className="flex h-16 shrink-0 items-center justify-around border-t border-border bg-background px-2 md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon
              className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* More dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-48">
          {moreItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn("flex items-center gap-2", isActive && "text-primary")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
