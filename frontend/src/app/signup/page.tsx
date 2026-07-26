import type { Metadata } from "next";
import { SignupPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Create account — LingoTrail",
  description: "Create your own LingoTrail language-learning account.",
};

export default function CreateAccountPage() {
  return <SignupPage />;
}
