import type { Metadata } from "next";
import { AdvisorPageClient } from "./advisor-page-client";

export const metadata: Metadata = {
  title: "AI Advisor",
  description:
    "Chat with the FinSight AI Advisor using your live accounts, budgets, goals, recurring bills, and full transaction history.",
  openGraph: {
    title: "AI Advisor | FinSight",
    description:
      "Use FinSight AI Advisor to analyze spending, savings, budgets, and recurring bills with your real financial data.",
    url: "/advisor",
  },
};

export default function AdvisorPage() {
  return <AdvisorPageClient />;
}
