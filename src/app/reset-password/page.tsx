"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { resetPasswordWithOtp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Lock, ArrowLeft, ShieldCheck } from "lucide-react";

const BLUE = "#1E4FD8";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code") || searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(code);
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("token", token);
    formData.append("newPassword", newPassword);

    startTransition(async () => {
      const res = await resetPasswordWithOtp({}, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg("Password reset successfully! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4 inline-block">
            <Image
              src="/brand/logo-light.png"
              alt="Eco Matrix Solutions"
              width={180}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Set New Password</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your email, OTP verification code, and your new account password.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-sm text-white outline-none focus:border-[#1E4FD8]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              OTP Code / Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter OTP token"
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-sm text-white outline-none focus:border-[#1E4FD8]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 text-sm text-white outline-none focus:border-[#1E4FD8]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="w-full font-bold text-white shadow-lg hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            {isPending ? "Updating Password..." : "Update Password & Launch Dashboard"}
          </Button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="size-3.5" /> Back to Landing Page
          </Link>
        </div>

        <div className="border-t border-slate-800 pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-400" /> ECO Matrix Secure Authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
