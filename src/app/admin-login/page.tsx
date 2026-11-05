"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react";

const BLUE = "#1E4FD8";

function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-4 inline-block transition-transform hover:scale-105">
            <Image
              src="/logo-white.png"
              alt="Eco Matrix Solutions"
              width={280}
              height={50}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Admin Sign-In</h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Restricted to the ECO Matrix Admin Portal. Everyone else should use the email-only
            &quot;Launch ERV Tool&quot; sign-in on the home page.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value="/admin" />
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@gmail.com"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
            </div>

            {state.error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              size="lg"
              className="w-full font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              {pending ? "Signing in..." : "Sign In to Admin Portal"}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Home Page
          </Link>
        </div>

        <div className="border-t border-slate-800 pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-400" /> Protected by ECO Matrix Secure Auth
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
