import { AuthShell } from "./components/auth-shell";
import { LoginForm } from "./components/login-form";

interface AuthPageProps {
  accountCreated?: boolean;
  initialUsername?: string;
}

export function AuthPage({
  accountCreated = false,
  initialUsername = "",
}: AuthPageProps) {
  return (
    <AuthShell>
      <LoginForm
        accountCreated={accountCreated}
        initialUsername={initialUsername}
      />
    </AuthShell>
  );
}
