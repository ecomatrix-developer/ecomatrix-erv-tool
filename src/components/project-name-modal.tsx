"use client";

import { useState, useTransition } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { createProject } from "@/app/actions/projects";
import { AlertCircle } from "lucide-react";

const BLUE = "#1E4FD8";

interface ProjectNameModalProps {
  open: boolean;
  onCreated: (projectId: string, name: string) => void;
}

export function ProjectNameModal({ open, onCreated }: ProjectNameModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter a project name to continue.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createProject(name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onCreated(result.id, name.trim());
    });
  }

  return (
    <DialogPrimitive.Root open={open} modal={false}>
      <DialogPrimitive.Portal>
        {/* Non-modal backdrop: Left inset left-[68px] keeps the navigation sidebar completely free.
         * The overlay does not trap focus or block clicks outside. */}
        <div className="fixed inset-y-0 right-0 left-[68px] z-30 bg-slate-900/30 backdrop-blur-[2px] transition-all animate-in fade-in-0" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-[calc(50%+34px)] z-40 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-0 zoom-in-95"
        >
          <DialogPrimitive.Title className="text-lg font-bold text-slate-900">
            Name your project
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-xs text-slate-500">
            Give this ERV simulation a name so you can find it later under Past Runs &amp; History.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bombay Office Retrofit"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
            />
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={pending}
              className="h-10 w-full rounded-xl text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: BLUE }}
            >
              {pending ? "Creating…" : "Start Project"}
            </button>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
