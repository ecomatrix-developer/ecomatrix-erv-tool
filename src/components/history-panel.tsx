"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectSummary } from "@/app/actions/projects";
import { getScenarios, deleteProject } from "@/app/actions/projects";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import type { CalculateResult } from "@/lib/calc-engine/types";
import { parseCalculateRequest } from "@/lib/calc-engine/request";
import { runAllScenarios } from "@/lib/calc-engine/engine";
import { EditableInputsTable, AnalysisTable } from "@/components/results-table";
import {
  DateRangePicker,
  getDefaultDateRange,
  isDateInRange,
  type DateRangeValue,
} from "@/components/date-range-picker";
import {
  FolderKanban,
  Calendar,
  Layers,
  Trash2,
  X,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calculator,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const BLUE = "#1E4FD8";

export function HistoryPanel({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const [projects, setProjects] = useState<ProjectSummary[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(getDefaultDateRange());

  // Modal State for viewing a run
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculateResult | null>(null);
  const [payloads, setPayloads] = useState<ScenarioInputsPayload[]>([]);

  // In-app Delete Confirmation & Toast State (no browser popups)
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<ProjectSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  // Filter projects by search query AND date range (default last 7 days)
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      isDateInRange(p.updatedAt, dateRange.startDate, dateRange.endDate)
  );

  async function handleOpenModal(project: ProjectSummary) {
    setSelectedProject(project);
    setLoading(true);
    setCalcResult(null);
    setPayloads([]);

    try {
      const rows = await getScenarios(project.id);
      if (rows && rows.length > 0) {
        const inputPayloads = rows.map((r) => r.inputs as ScenarioInputsPayload);
        setPayloads(inputPayloads);

        const res = runAllScenarios(parseCalculateRequest({ scenarios: inputPayloads }));
        setCalcResult(res);
      }
    } catch (err) {
      console.error("Error loading project scenarios:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleCloseModal() {
    setSelectedProject(null);
    setCalcResult(null);
    setPayloads([]);
  }

  async function confirmDeleteProject() {
    if (!deleteConfirmProject) return;
    const projectId = deleteConfirmProject.id;
    const projectName = deleteConfirmProject.name;

    setDeletingId(projectId);
    try {
      const res = await deleteProject(projectId);
      if ("ok" in res) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (selectedProject?.id === projectId) {
          handleCloseModal();
        }
        setToastNotice({ type: "success", text: `Successfully deleted project "${projectName}".` });
        setTimeout(() => setToastNotice(null), 3000);
        router.refresh();
      } else {
        setToastNotice({ type: "error", text: "Failed to delete project run." });
      }
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      setToastNotice({ type: "error", text: err.message || "Failed to delete project." });
    } finally {
      setDeletingId(null);
      setDeleteConfirmProject(null);
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 p-6 sm:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Past Runs & History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse all saved project runs. Click any card to inspect previous inputs, outputs, and financial analysis.
          </p>
        </div>

        {/* Controls: Search + Modern Date Range Picker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20"
            />
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* In-App Toast Notification Banner */}
      {toastNotice && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-bold shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toastNotice.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastNotice.type === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            <span>{toastNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="rounded p-1 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Grid of Project Cards */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
          <FolderKanban className="size-12 text-slate-300 mb-3" />
          <p className="text-base font-medium text-slate-700">No project runs found</p>
          <p className="mt-1 text-sm text-slate-400 max-w-sm">
            {search
              ? "No projects match your search query."
              : `No project runs recorded between ${dateRange.startDate} and ${dateRange.endDate}.`}
          </p>
          <button
            type="button"
            onClick={() => setDateRange(getDefaultDateRange())}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: BLUE }}
          >
            Reset Date Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((p) => {
            const dateStr = new Date(p.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = new Date(p.updatedAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={p.id}
                onClick={() => handleOpenModal(p)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1E4FD8]/40 hover:shadow-md cursor-pointer"
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-[#1E4FD8]">
                        <FolderKanban className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-[#1E4FD8] transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="size-3" /> {dateStr} at {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <Layers className="size-3.5 text-slate-400" />
                      {p.scenarioCount} {p.scenarioCount === 1 ? "Scenario" : "Scenarios"}
                    </span>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-[#1E4FD8]">
                    <Eye className="size-3.5" /> View Run
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/simulator?projectId=${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1E4FD8] px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <Zap className="size-3.5 fill-amber-300 text-amber-300" /> Open in Simulator
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmProject(p);
                      }}
                      disabled={deletingId === p.id}
                      title="Delete project"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Replaces browser confirm dialog) */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Project Run History?</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-bold block text-slate-900 mb-0.5">Selected Project:</span>
              <span className="font-semibold text-blue-700">{deleteConfirmProject.name}</span>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirmProject(null)}
                disabled={deletingId !== null}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteProject}
                disabled={deletingId !== null}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
              >
                {deletingId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal Card for Viewing Past Run */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#1E4FD8] text-white">
                  <FolderKanban className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedProject.name}</h2>
                  <p className="text-xs text-slate-500">
                    Last updated {new Date(selectedProject.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/simulator?projectId=${selectedProject.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4FD8] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Zap className="size-4 fill-amber-300 text-amber-300" /> Open in Simulator
                </Link>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with Tabs */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="size-8 animate-spin text-[#1E4FD8] mb-2" />
                  <p className="text-sm font-medium">Loading project simulation data...</p>
                </div>
              ) : calcResult && payloads.length > 0 ? (
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-2 max-w-md bg-slate-100 p-1">
                    <TabsTrigger value="analysis" className="rounded-lg font-bold text-xs">
                      Financial &amp; Energy Analysis
                    </TabsTrigger>
                    <TabsTrigger value="inputs" className="rounded-lg font-bold text-xs">
                      Scenario Inputs Table
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="space-y-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Run Overview Summary
                      </h3>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedProject.name} — {calcResult.scenarios.length} Scenarios Calculated across 8,760 Annual Hours.
                      </p>
                    </div>

                    <AnalysisTable
                      analysis={calcResult.analysis}
                    />
                  </TabsContent>

                  <TabsContent value="inputs" className="space-y-6">
                    <EditableInputsTable
                      payloads={payloads}
                      scenarios={calcResult.scenarios}
                      editingIndex={null}
                      draft={null}
                      recalcIndex={null}
                      readOnly={true}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  No scenario inputs found for this project run.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
