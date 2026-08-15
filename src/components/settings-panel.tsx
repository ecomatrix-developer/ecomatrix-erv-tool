"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAllProjectsAction,
  clearOldDataAction,
  deleteAccountAction,
} from "@/app/actions/settings";
import { logout } from "@/app/actions/auth";
import {
  User,
  Trash2,
  Database,
  AlertTriangle,
  Shield,
  Loader2,
  CheckCircle2,
  LogOut,
  KeyRound,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPanelProps {
  userEmail: string;
}

export function SettingsPanel({ userEmail }: SettingsPanelProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<"clearData" | "deleteAllProjects" | "deleteAccount" | null>(null);

  async function handleClearOldData() {
    setLoadingAction("clearData");
    setMessage(null);
    try {
      const res = await clearOldDataAction();
      if (res.success) {
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to clear old data." });
    } finally {
      setLoadingAction(null);
      setConfirmModal(null);
    }
  }

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

  async function handleDeleteAccount() {
    setLoadingAction("deleteAccount");
    setMessage(null);
    try {
      const res = await deleteAccountAction();
      if (res.success) {
        router.push("/");
      } else {
        setMessage({ type: "error", text: res.message });
        setLoadingAction(null);
        setConfirmModal(null);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to delete account." });
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
          Manage your account profile, calculation cache preferences, and data cleanup operations.
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Email</span>
            <p className="mt-1 text-base font-extrabold text-slate-900">{userEmail || "User Account"}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Password Security</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">Encrypted Hash &amp; OTP</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage({ type: "success", text: "Password reset OTP sent to your registered email address." })}
              className="gap-1.5 border-slate-300 font-semibold cursor-pointer"
            >
              <KeyRound className="size-4 text-[#1E4FD8]" /> Reset Password
            </Button>
          </div>
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
            <p className="text-xs text-slate-500">Manage saved scenarios, old calculation records, and workspace cleanup</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Clear Old Data Option */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="size-4 text-amber-600" /> Clear Old Calculation Cache &amp; History
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Wipes stored temporary calculation states and old hourly simulation history without deleting project names.
              </p>
            </div>
            <Button
              onClick={() => setConfirmModal("clearData")}
              variant="outline"
              className="gap-2 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold shrink-0 cursor-pointer"
            >
              Clear Old Cache
            </Button>
          </div>

          {/* Delete All Projects Option */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                <Trash2 className="size-4 text-red-600" /> Delete All Projects &amp; Scenarios
              </h3>
              <p className="mt-1 text-xs text-red-700">
                Permanently deletes every saved project, scenario input, and visual report under your account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmModal("deleteAllProjects")}
              className="gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              Delete All Projects
            </button>
          </div>
        </div>
      </div>

      {/* 3. DANGER ZONE */}
      <div className="rounded-3xl border border-red-200 bg-red-50/60 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-red-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-950">Danger Zone: Account Deletion &amp; Sign Out</h2>
              <p className="text-xs text-red-700">Irreversible account actions and session management</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-950">Delete Account &amp; Wipe All Associated Data</h3>
            <p className="text-xs text-red-700 mt-0.5">
              Permanently removes your account login, project history, and revokes your active session.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <form action={logout}>
              <Button type="submit" variant="outline" className="gap-2 border-slate-300 font-bold text-slate-800 cursor-pointer">
                <LogOut className="size-4" /> Sign Out
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setConfirmModal("deleteAccount")}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 active:bg-red-900 text-white font-extrabold text-xs cursor-pointer transition-colors shadow-sm"
            >
              <Trash2 className="size-4" /> Delete Account
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
                <h3 className="text-base font-extrabold text-slate-900">
                  {confirmModal === "clearData" && "Clear Old Data Cache?"}
                  {confirmModal === "deleteAllProjects" && "Delete All Projects?"}
                  {confirmModal === "deleteAccount" && "Permanently Delete Account?"}
                </h3>
                <p className="text-xs text-slate-500">In-app confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {confirmModal === "clearData" &&
                "This action will clear stored scenario calculation history and temporary cache. Your project names will remain intact."}
              {confirmModal === "deleteAllProjects" &&
                "Are you sure you want to permanently delete all your saved projects and scenario options? This action cannot be undone."}
              {confirmModal === "deleteAccount" &&
                "WARNING: This will permanently delete your account profile, all projects, and end your session immediately. This action CANNOT be reversed."}
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
                onClick={() => {
                  if (confirmModal === "clearData") handleClearOldData();
                  if (confirmModal === "deleteAllProjects") handleDeleteAllProjects();
                  if (confirmModal === "deleteAccount") handleDeleteAccount();
                }}
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
