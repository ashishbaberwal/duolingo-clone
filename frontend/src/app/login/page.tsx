import type { Metadata } from "next";
import { AuthPage } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in — LingoTrail",
  description: "Return to your LingoTrail language-learning path.",
};

interface LoginPageProps {
  searchParams?: Promise<{
    created?: string;
    username?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <AuthPage
      accountCreated={params.created === "true"}
      initialUsername={params.username ?? ""}
    />
  );
}
