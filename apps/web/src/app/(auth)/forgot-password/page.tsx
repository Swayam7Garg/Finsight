import type { Metadata } from "next";
import { ForgotPasswordClient } from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your FinSight account password.",
  alternates: {
    canonical: "/forgot-password",
  },
  openGraph: {
    title: "Forgot Password | FinSight",
    description: "Reset your FinSight account password.",
    url: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
