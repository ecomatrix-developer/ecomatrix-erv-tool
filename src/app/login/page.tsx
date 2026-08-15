import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm action={login} />
    </Suspense>
  );
}
