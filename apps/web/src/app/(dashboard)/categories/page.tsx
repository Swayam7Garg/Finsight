import type { Metadata } from "next";
import { CategoriesPageClient } from "./categories-page-client";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Create, organize, and protect the categories that power your FinSight budgets, recurring rules, analytics, and transaction workflows.",
  openGraph: {
    title: "Categories | FinSight",
    description:
      "Manage the category system behind your budgets, recurring rules, analytics, and transaction history in FinSight.",
    url: "/categories",
  },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
