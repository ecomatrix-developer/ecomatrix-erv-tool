"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CloudSun,
  Plus,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  ShieldCheck,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { parseEpwFile, type ParsedEpw } from "@/lib/epw-parser";
import {
  getUsersList,
  createAdminUserAccount,
  deleteAdminUserAccount,
  changeUserPassword,
  toggleUserStatus,
  adminUploadGlobalWeather,
  listGlobalWeatherFiles,
  deleteGlobalWeatherFile,
  type UserRecord,
  type AdminWeatherRecord,
} from "@/app/actions/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [globalWeather, setGlobalWeather] = useState<AdminWeatherRecord[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [submittingUser, setSubmittingUser] = useState(false);

  const [showChangePassModal, setShowChangePassModal] = useState<UserRecord | null>(null);
  const [changePasswordVal, setChangePasswordVal] = useState("");
  const [submittingPass, setSubmittingPass] = useState(false);

  const [deleteUserConfirm, setDeleteUserConfirm] = useState<UserRecord | null>(null);

  // Weather Upload States
  const [parsedWeather, setParsedWeather] = useState<{
    file: File;
    parsed: ParsedEpw;
    customName: string;
  } | null>(null);
  const [uploadingWeather, setUploadingWeather] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setNotice(null);
    const [uRes, wData] = await Promise.all([getUsersList(), listGlobalWeatherFiles()]);
    if (uRes.error) {
      setNotice({ type: "error", text: uRes.error });
    } else if (uRes.users) {
      setUsers(uRes.users);
    }
    setGlobalWeather(wData);
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingUser(true);
    setNotice(null);
    const res = await createAdminUserAccount({
      email: newEmail,
      password: newPassword,
      fullName: newFullName,
    });
    setSubmittingUser(false);
    if (res.error) {
      setNotice({ type: "error", text: res.error });
    } else {
      setNotice({ type: "success", text: `User account ${newEmail} created successfully.` });
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setShowCreateUserModal(false);
      loadData();
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!showChangePassModal) return;
    setSubmittingPass(true);
    setNotice(null);
    const res = await changeUserPassword(showChangePassModal.id, changePasswordVal);
    setSubmittingPass(false);
    if (res.error) {
      setNotice({ type: "error", text: res.error });
    } else {
      setNotice({ type: "success", text: `Password updated for ${showChangePassModal.email}.` });
      setChangePasswordVal("");
      setShowChangePassModal(null);
      loadData();
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserConfirm) return;
    setNotice(null);
    const res = await deleteAdminUserAccount(deleteUserConfirm.id);
    if (res.error) {
      setNotice({ type: "error", text: res.error });
    } else {
      setNotice({ type: "success", text: `User account ${deleteUserConfirm.email} deleted.` });
      setDeleteUserConfirm(null);
      loadData();
    }
  }

  async function handleToggleStatus(user: UserRecord) {
    setNotice(null);
    const nextStatus = !user.is_active;
    const res = await toggleUserStatus(user.id, nextStatus);
    if (res.error) {
      setNotice({ type: "error", text: res.error });
    } else {
      setNotice({ type: "success", text: `User ${user.email} is now ${nextStatus ? "Active" : "Disabled"}.` });
      loadData();
    }
  }

  async function handleFileSelected(file: File) {
    setNotice(null);
    try {
      const parsed = await parseEpwFile(file);
      setParsedWeather({
        file,
        parsed,
        customName: parsed.locationName,
      });
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Failed to parse weather file." });
    }
  }

  async function handlePublishWeather() {
    if (!parsedWeather) return;
    setUploadingWeather(true);
    setNotice(null);
    const res = await adminUploadGlobalWeather(
      parsedWeather.customName,
      parsedWeather.file.name,
      parsedWeather.parsed.dbt,
      parsedWeather.parsed.rh
    );
    setUploadingWeather(false);
    if (res.error) {
      setNotice({ type: "error", text: res.error });
    } else {
      setNotice({
        type: "success",
        text: `Global weather file "${parsedWeather.customName}" published! Available in Location Picker for all users.`,
      });
      setParsedWeather(null);
      loadData();
    }
  }

  async function handleDeleteGlobalWeather(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove global weather location "${name}"?`)) return;
    setNotice(null);
    const res = await deleteGlobalWeatherFile(id);
    if (res.error) {
      setNotice({ type: "error", text: res.error });
    } else {
      setNotice({ type: "success", text: `Weather location "${name}" removed.` });
      loadData();
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(userQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600/20 text-[#1E4FD8] border border-blue-500/30">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">System Admin Portal</h1>
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
                admin@gmail.com
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage user accounts, credentials, and publish global EPW/FWT weather files for all users.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh Data
          </button>
          <button
            type="button"
            onClick={() => router.push("/simulator")}
            className="flex items-center gap-1.5 rounded-lg bg-[#1E4FD8] px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Back to Simulator
          </button>
        </div>
      </div>

      {/* Global Status Notice */}
      {notice && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl p-3 text-xs font-semibold shadow-sm border",
            notice.type === "success"
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80"
              : "bg-red-950/60 text-red-300 border-red-800/80"
          )}
        >
          {notice.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Total Registered Users</p>
            <p className="text-2xl font-black text-white mt-1">{users.length}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Active Accounts</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{users.filter((u) => u.is_active !== false).length}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">Global Weather Locations</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{globalWeather.length}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CloudSun className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Admin Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700/80 p-1 rounded-xl">
          <TabsTrigger value="users" className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold data-[state=active]:bg-[#1E4FD8] data-[state=active]:text-white">
            <Users className="size-3.5" />
            User Accounts ({users.length})
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold data-[state=active]:bg-[#1E4FD8] data-[state=active]:text-white">
            <CloudSun className="size-3.5" />
            Global Weather Library ({globalWeather.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: USER ACCOUNTS */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search users by email or name…"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              Create New User Account
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">User Email / Account</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No user accounts found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isAdmin = u.email === "admin@gmail.com";
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{u.email}</span>
                            {isAdmin && (
                              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                                ROOT ADMIN
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{u.full_name || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                              u.is_active !== false
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}
                          >
                            {u.is_active !== false ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                            {u.is_active !== false ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowChangePassModal(u)}
                              title="Change User Password"
                              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                            >
                              <KeyRound className="size-3 text-amber-400" />
                              Reset Password
                            </button>

                            {!isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  title={u.is_active !== false ? "Disable User" : "Activate User"}
                                  className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                  {u.is_active !== false ? "Disable" : "Enable"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteUserConfirm(u)}
                                  title="Delete User Account"
                                  className="rounded-md bg-red-600/20 border border-red-500/30 p-1 text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB 2: GLOBAL WEATHER LIBRARY */}
        <TabsContent value="weather" className="space-y-6">
          {/* Admin Upload Zone */}
          <div className="rounded-2xl border border-dashed border-blue-500/40 bg-blue-950/20 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="size-4 text-blue-400" />
                  Upload &amp; Publish Global Weather File (.epw / .fwt)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted hourly weather data (8,760 hours DBT &amp; RH) will be published globally for all simulator users.
                </p>
              </div>

              <label className="flex items-center gap-2 rounded-xl bg-[#1E4FD8] hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-md transition-colors w-fit">
                <FileSpreadsheet className="size-4" />
                Select EPW / FWT File
                <input
                  type="file"
                  accept=".epw,.fwt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                />
              </label>
            </div>

            {/* Parsed Weather File Preview */}
            {parsedWeather && (
              <div className="rounded-xl border border-blue-500/30 bg-slate-800 p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-extrabold text-white">
                        Extracted Weather Data: {parsedWeather.parsed.locationName}
                      </h4>
                      <p className="text-[11px] text-slate-400">File: {parsedWeather.file.name}</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    8,760 Hourly Records Validated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Min Temp</span>
                    <span className="font-extrabold text-white">
                      {Math.min(...parsedWeather.parsed.dbt)} °C
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Max Temp</span>
                    <span className="font-extrabold text-white">
                      {Math.max(...parsedWeather.parsed.dbt)} °C
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Avg Relative Humidity</span>
                    <span className="font-extrabold text-white">
                      {Math.round((parsedWeather.parsed.rh.reduce((a, b) => a + b, 0) / 8760) * 10) / 10} %
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Format</span>
                    <span className="font-extrabold text-blue-400">
                      {parsedWeather.file.name.endsWith(".fwt") ? "FWT Binary" : "EPW Text"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Location Display Name in Picker:
                    </label>
                    <input
                      type="text"
                      value={parsedWeather.customName}
                      onChange={(e) => setParsedWeather({ ...parsedWeather, customName: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePublishWeather}
                    disabled={uploadingWeather}
                    className="self-end rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploadingWeather ? "Publishing..." : "Publish to Global Database"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsedWeather(null)}
                    className="self-end rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Published Global Weather Files */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CloudSun className="size-4 text-amber-400" />
              Published Global Weather Files ({globalWeather.length})
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/40">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Location Name</th>
                    <th className="px-4 py-3">Source File</th>
                    <th className="px-4 py-3">Hourly Points</th>
                    <th className="px-4 py-3">Published Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {globalWeather.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        No global weather files published yet. Upload an EPW or FWT file above to publish!
                      </td>
                    </tr>
                  ) : (
                    globalWeather.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3 font-bold text-white">{w.name}</td>
                        <td className="px-4 py-3 text-slate-400">{w.source_filename}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">8,760 Hours</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteGlobalWeather(w.id, w.name)}
                            className="rounded-md bg-red-600/20 border border-red-500/30 px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateUser} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="size-5 text-emerald-400" />
              Create New User Account
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUser}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
              >
                {submittingUser ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleChangePassword} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="size-5 text-amber-400" />
              Reset Password for {showChangePassModal.email}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={changePasswordVal}
                onChange={(e) => setChangePasswordVal(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowChangePassModal(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPass}
                className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
              >
                {submittingPass ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="size-5" />
              Confirm Delete User Account
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete user account <strong className="text-white">{deleteUserConfirm.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteUserConfirm(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
