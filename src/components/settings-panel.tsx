"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAllProjectsAction } from "@/app/actions/settings";
import {
  User,
  Trash2,
  Database,
  AlertTriangle,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface SettingsPanelProps {
  userEmail: string;
}

export function SettingsPanel({ userEmail }: SettingsPanelProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [confirmModal, setConfirmModal] = useState<"deleteAllProjects" | null>(null);

  async function handleDeleteAllProjects() {
    setLoadingAction("deleteAllProjects");
    setMessage(null);
    try {
      const res = await deleteAllProjectsAction();
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        router.refresh();
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete projects." });
    } finally {
      setLoadingAction(null);
      setConfirmModal(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
          <Shield className="size-7 text-[#1E4FD8]" /> Account &amp; Platform Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account profile and project data.
        </p>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold shadow-xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="size-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. PROFILE & ACCOUNT CARD */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1E4FD8]">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">User Profile &amp; Authentication</h2>
              <p className="text-xs text-slate-500">Your registered ECO Matrix account session</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Active Session
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Email</span>
          <p className="mt-1 text-base font-extrabold text-slate-900">{userEmail || "User Account"}</p>
        </div>
      </div>

      {/* 2. DATA & PROJECT MANAGEMENT */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Database className="size-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Project &amp; Calculation Data Maintenance</h2>
            <p className="text-xs text-slate-500">Manage your saved projects and scenarios</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Delete All Projects Option */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="size-4 text-red-600" /> Delete All Projects &amp; Scenarios
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Permanently deletes every saved project, scenario input, and visual report under your account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmModal("deleteAllProjects")}
              className="gap-2 px-5 py-2.5 rounded-xl border border-red-300 bg-white text-red-700 hover:bg-red-50 font-bold text-xs shrink-0 cursor-pointer transition-colors"
            >
              Delete All Projects
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL (In-App Modal - No browser dialogs) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete All Projects?</h3>
                <p className="text-xs text-slate-500">In-app confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to permanently delete all your saved projects and scenario options? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={loadingAction !== null}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAllProjects}
                disabled={loadingAction !== null}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
              >
                {loadingAction ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
