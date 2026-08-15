"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { login, requestPasswordReset, resetPasswordWithOtp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, X, ArrowLeft, ShieldCheck } from "lucide-react";

const BLUE = "#1E4FD8";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "forgot" | "verify_otp";

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isPending, startTransition] = useTransition();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const res = await login({}, formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const formData = new FormData();
    formData.append("email", email);

    startTransition(async () => {
      const res = await requestPasswordReset({}, formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccessMsg(res.message || "OTP code sent to your email address!");
        setMode("verify_otp");
      }
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const formData = new FormData();
    formData.append("email", email);
    formData.append("token", otpToken);
    formData.append("newPassword", newPassword);

    startTransition(async () => {
      const res = await resetPasswordWithOtp({}, formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccessMsg("Password reset successfully! Logging you in...");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl sm:p-8">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/logo-light.png"
            alt="Eco Matrix Solutions"
            width={180}
            height={50}
            className="mb-4 h-10 w-auto object-contain"
            priority
          />

          {mode === "login" && (
            <>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Log in to ECO Matrix
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Access your ERV project simulations &amp; performance analytics.
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Reset Your Password
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Enter your email address to receive an OTP verification code.
              </p>
            </>
          )}

          {mode === "verify_otp" && (
            <>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Enter OTP &amp; New Password
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                We sent a 6-digit OTP code to your registered email address.
              </p>
            </>
          )}
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetState();
                    setMode("forgot");
                  }}
                  className="text-xs font-bold text-[#1E4FD8] transition-colors hover:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="mt-2 w-full font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              {isPending ? "Authenticating..." : "Log In & Launch ERV Tool"}
            </Button>
          </form>
        )}

        {/* MODE 2: FORGOT PASSWORD REQUEST */}
        {mode === "forgot" && (
          <form onSubmit={handleRequestReset} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
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
              {isPending ? "Sending OTP..." : "Send OTP Reset Code"}
            </Button>

            <button
              type="button"
              onClick={() => {
                resetState();
                setMode("login");
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="size-3.5" /> Back to Log In
            </button>
          </form>
        )}

        {/* MODE 3: VERIFY OTP & NEW PASSWORD */}
        {mode === "verify_otp" && (
          <form onSubmit={handleResetPasswordSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 text-sm text-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                OTP Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  placeholder="Enter 6-digit OTP code"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
                />
              </div>
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
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
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
              {isPending ? "Updating Password..." : "Reset Password & Log In"}
            </Button>

            <button
              type="button"
              onClick={() => {
                resetState();
                setMode("login");
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="size-3.5" /> Back to Log In
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-800 pt-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-400" /> Protected by ECO Matrix Secure Auth
          </p>
        </div>
      </div>
    </div>
  );
}
