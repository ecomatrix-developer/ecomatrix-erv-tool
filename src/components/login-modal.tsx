"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { continueWithEmail, login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Mail, X, ShieldCheck } from "lucide-react";

const BLUE = "#1E4FD8";
const ADMIN_EMAIL = "admin@gmail.com";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Path to send the user to once they're signed in. Defaults to /dashboard. */
  next?: string;
}

export function LoginModal({ isOpen, onClose, next = "/dashboard" }: LoginModalProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
        if (res?.error) {
          setError(res.error);
        }
      });
      return;
    }

    startTransition(async () => {
      const res = await continueWithEmail({}, formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Eco Matrix Solutions"
            width={267}
            height={50}
            className="mb-4 h-10 w-auto object-contain"
            priority
          />

          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {isAdminEmail ? "Admin Sign-In" : "Launch the ERV Tool"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {isAdminEmail
              ? "Enter your admin password to continue."
              : "Enter your work email. New here? We'll start your 14-day free trial automatically."}
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
              />
            </div>
          </div>

          {isAdminEmail && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="mt-2 w-full font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            {isPending
              ? "Checking your account..."
              : isAdminEmail
                ? "Sign In to Admin Portal"
                : "Continue & Launch ERV Tool"}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-600" /> Protected by ECO Matrix Secure Auth
          </p>
        </div>
      </div>
    </div>
  );
}
