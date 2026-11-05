"use client";

import { useEffect } from "react";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastState {
  message: string;
  variant?: "info" | "success" | "error";
}

interface ToastProps {
  state: ToastState | null;
  onClose: () => void;
  durationMs?: number;
}

const ICONS = { info: Info, success: CheckCircle2, error: AlertCircle } as const;
const ICON_COLORS = { info: "text-blue-400", success: "text-emerald-400", error: "text-red-400" } as const;

/** App-styled, auto-dismissing replacement for window.alert(). Drive it with a
 * single `useState<ToastState | null>(null)` in the calling component. */
export function Toast({ state, onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!state) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [state, onClose, durationMs]);

  if (!state) return null;
  const variant = state.variant ?? "info";
  const Icon = ICONS[variant];

  return (
    <div className="fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl max-w-sm">
        <Icon className={cn("size-4 shrink-0", ICON_COLORS[variant])} />
        <span className="flex-1">{state.message}</span>
        <button type="button" onClick={onClose} className="shrink-0 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
