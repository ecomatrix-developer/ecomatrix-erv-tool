"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { continueWithEmail, login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Lock, Mail } from "lucide-react";

const BLUE = "#1E4FD8";
const ADMIN_EMAIL = "admin@gmail.com";

export function AuthForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const trialExpired = searchParams.get("trialExpired") === "1";

  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("next", next);

    if (isAdminEmail) {
      formData.append("password", password);
      startTransition(async () => {
        const res = await login({}, formData);
        if (res?.error) setError(res.error);
      });
      return;
    }

    startTransition(async () => {
      const res = await continueWithEmail({}, formData);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4 inline-block transition-transform hover:scale-105">
            <Image
              src="/logo-white.png"
              alt="Eco Matrix"
              width={336}
              height={60}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-1 text-sm text-slate-500">
            {isAdminEmail ? "Enter your admin password to continue." : "Access your saved ERV projects and simulation analytics."}
          </p>
        </div>

        {trialExpired && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-700">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>
              Your 14-day free trial has ended. Please contact ECO Matrix Solutions to continue using the ERV Tool.
            </span>
          </div>
        )}

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
              {!isAdminEmail && (
                <p className="text-xs text-slate-400">No password needed. New emails start a 14-day free trial.</p>
              )}
            </div>

            {isAdminEmail && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full font-bold text-white shadow hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BLUE }}
            >
              {isPending ? "Checking your account..." : isAdminEmail ? "Sign In to Admin Portal" : "Continue"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
