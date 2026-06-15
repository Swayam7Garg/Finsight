import type { Metadata } from "next";
import { FinancialHealthPageClient } from "./financial-health-page-client";

export const metadata: Metadata = {
  title: "Health Score",
  description:
    "Review your Financial Health Score based on cash flow, budgets, goals, and tracking consistency.",
  openGraph: {
    title: "Health Score | FinSight",
    description:
      "Review your Financial Health Score based on cash flow, budgets, goals, and tracking consistency.",
    url: "/financial-health",
  },
};

export default function FinancialHealthPage() {
  return <FinancialHealthPageClient />;
}
