"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogState {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  state: ConfirmDialogState | null;
  onCancel: () => void;
}

/** App-styled replacement for window.confirm(). Drive it with a single
 * `useState<ConfirmDialogState | null>(null)` in the calling component. */
export function ConfirmDialog({ state, onCancel }: ConfirmDialogProps) {
  if (!state) return null;
  const { title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "default", onConfirm } = state;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              variant === "danger" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400",
            )}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-colors cursor-pointer",
              variant === "danger" ? "bg-red-600 hover:bg-red-500" : "bg-[#1E4FD8] hover:bg-blue-600",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
