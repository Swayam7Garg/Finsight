import { cn, formatCurrency } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  type?: "income" | "expense" | "transfer" | "neutral";
  showSign?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CurrencyDisplay({
  amount,
  currency = "USD",
  type = "neutral",
  showSign = true,
  className,
  size = "md",
}: CurrencyDisplayProps) {
  const isPositive = type === "income";
  const isNegative = type === "expense";

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
  };

  return (
    <span
      className={cn(
        "tabular-nums",
        sizeClasses[size],
        isPositive && "text-emerald-600 dark:text-emerald-400",
        isNegative && "text-red-600 dark:text-red-400",
        !isPositive && !isNegative && "text-foreground",
        className
      )}
    >
      {showSign && isPositive && "+"}
      {showSign && isNegative && "-"}
      {formatCurrency(Math.abs(amount), currency)}
    </span>
  );
}
