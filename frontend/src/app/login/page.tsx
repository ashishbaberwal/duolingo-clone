import type { Metadata } from "next";
import { AuthPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in — LingoTrail",
  description: "Return to your LingoTrail language-learning path.",
};

export default function LoginPage() {
  return <AuthPage />;
}
