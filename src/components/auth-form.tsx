"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

const BLUE = "#1E4FD8";

interface AuthFormProps {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}

export function AuthForm({ action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4 inline-block transition-transform hover:scale-105">
            <Image
              src="/brand/logo.png"
              alt="Eco Matrix"
              width={200}
              height={60}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-1 text-sm text-slate-500">Access your saved ERV projects and simulation analytics.</p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-bold text-[#1E4FD8] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
              />
            </div>

            {state.error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              size="lg"
              className="w-full font-bold text-white shadow hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BLUE }}
            >
              {pending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
