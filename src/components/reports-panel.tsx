"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { ProjectSummary } from "@/app/actions/projects";
import { getScenarios } from "@/app/actions/projects";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import { parseCalculateRequest } from "@/lib/calc-engine/request";
import type { CalculateResult, ScenarioOutputs } from "@/lib/calc-engine/types";
import { runAllScenarios } from "@/lib/calc-engine/engine";
import { generateReportPdf } from "@/lib/generate-report-pdf";
import { ReportPreviewModal } from "@/components/report-preview-modal";
import { AnalysisCharts } from "@/components/analysis-charts";
import Link from "next/link";
import {
  FileText,
  Eye,
  Sparkles,
  X,
  TrendingDown,
  DollarSign,
  Leaf,
  Calendar,
  Loader2,
  BarChart3,
  PieChart,
  Sliders,
  MapPin,
  Clock,
  Zap,
  Activity,
  Award,
  TrendingUp,
  Download,
  Flame,
  Layers,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DateRangePicker,
  getDefaultDateRange,
  isDateInRange,
  type DateRangeValue,
} from "@/components/date-range-picker";

const BLUE = "#1E4FD8";

/* Donut / Pie Chart Component */
function DonutChart({ valuePct, label }: { valuePct: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(valuePct, 0), 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative size-24 flex items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-200"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-[#1E4FD8] transition-all duration-700 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-sm font-extrabold text-slate-900">{valuePct.toFixed(0)}%</span>
      </div>
      <span className="mt-2 text-xs font-bold text-slate-700 text-center">{label}</span>
    </div>
  );
}

/* 10-Year Cumulative ROI Line Graph */
function PaybackLineGraph({ paybackYears, annualSavings }: { paybackYears: number; annualSavings: number }) {
  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const points = years.map((yr) => (yr - paybackYears) * annualSavings);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const svgPoints = points
    .map((val, idx) => {
      const x = (idx / 10) * 350 + 25;
      const y = 135 - ((val - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const zeroY = 135 - ((0 - min) / range) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
        <span>Year 0 (Invest)</span>
        <span className="text-emerald-400">Payback ({paybackYears.toFixed(1)} Yrs)</span>
        <span>Year 10 (+${(annualSavings * (10 - paybackYears)).toLocaleString("en-US", { maximumFractionDigits: 0 })})</span>
      </div>
      <svg className="w-full h-36 bg-slate-950 rounded-2xl p-3 border border-slate-800" viewBox="0 0 400 150">
        {/* Zero baseline */}
        <line x1="20" y1={zeroY} x2="380" y2={zeroY} stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
        {/* Line Curve */}
        <polyline fill="none" stroke="#38bdf8" strokeWidth="3" points={svgPoints} strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {points.map((val, idx) => {
          const x = (idx / 10) * 350 + 25;
          const y = 135 - ((val - min) / range) * 100;
          return <circle key={idx} cx={x} cy={y} r="4" fill={val >= 0 ? "#34d399" : "#f87171"} />;
        })}
      </svg>
    </div>
  );
}

/* Generic horizontal bar comparison chart, reused for cost, CO2, and other single-metric comparisons */
function HorizontalBarChart({
  data,
  formatValue,
  barColor,
}: {
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
  barColor: (label: string, index: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1e-9);
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div key={d.label} className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>{d.label}</span>
              <span>{formatValue(d.value)}</span>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor(d.label, i) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Stacked bar chart breaking each scenario's total energy into its 4 stage components */
function StageBreakdownChart({ scenarios }: { scenarios: ScenarioOutputs[] }) {
  const stages: { key: keyof ScenarioOutputs; label: string; color: string }[] = [
    { key: "preheatEnergyMwh", label: "Preheat", color: "#f59e0b" },
    { key: "postHeatingEnergyMwh", label: "Post-Heat", color: "#f43f5e" },
    { key: "coolingEnergyMwh", label: "Post-Cool", color: "#1E4FD8" },
    { key: "humidificationEnergyMwh", label: "Humidification", color: "#10b981" },
  ];
  const maxTotal = Math.max(...scenarios.map((s) => s.totalEnergyMwh), 1e-9);

  return (
    <div className="space-y-3">
      {scenarios.map((s) => (
        <div key={s.scenario} className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>{s.scenario}</span>
            <span>{s.totalEnergyMwh.toLocaleString("en-US", { maximumFractionDigits: 1 })} MWh</span>
          </div>
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200">
            {stages.map(({ key, color }) => {
              const val = s[key] as number;
              const pct = (val / maxTotal) * 100;
              if (pct <= 0) return null;
              return <div key={key} className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />;
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-1">
        {stages.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-slate-500">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReportsPanel({
  projects,
  initialProjectId,
}: {
  projects: ProjectSummary[];
  initialProjectId?: string;
}) {
  const [dateRange, setDateRange] = useState<DateRangeValue>(getDefaultDateRange());

  const filteredProjects = projects.filter((p) =>
    isDateInRange(p.updatedAt, dateRange.startDate, dateRange.endDate)
  );

  const [selectedId, setSelectedId] = useState(
    initialProjectId || filteredProjects[0]?.id || projects[0]?.id || ""
  );
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Keep selectedId valid when filteredProjects changes or initialProjectId is set
  useEffect(() => {
    if (initialProjectId && projects.some((p) => p.id === initialProjectId)) {
      setSelectedId(initialProjectId);
      handleOpenPreview(initialProjectId);
    } else if (filteredProjects.length > 0 && !filteredProjects.some((p) => p.id === selectedId)) {
      setSelectedId(filteredProjects[0].id);
    }
  }, [initialProjectId, projects]);

  // Report Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState<{
    project: ProjectSummary;
    payloads: ScenarioInputsPayload[];
    result: CalculateResult;
  } | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && previewOpen) {
        setPreviewOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOpen]);

  async function handleOpenPreview(projectId = selectedId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setSelectedId(projectId);
    setLoadingReport(true);
    setPreviewOpen(true);

    try {
      const rows = await getScenarios(projectId);
      if (rows && rows.length > 0) {
        const inputPayloads = rows.map((r) => r.inputs as ScenarioInputsPayload);
        const res = runAllScenarios(parseCalculateRequest({ scenarios: inputPayloads }));
        setReportData({
          project,
          payloads: inputPayloads,
          result: res,
        });
      }
    } catch (err) {
      console.error("Error loading report data:", err);
    } finally {
      setLoadingReport(false);
    }
  }

  /**
   * Generates the PDF directly from data with jsPDF (vector text/tables/charts, no DOM
   * screenshot step) so it downloads as a real file immediately -- no CDN load, no
   * html2canvas, and no risk of falling back to the browser's print dialog.
   */
  async function handleDownloadPdfDirect(projectId = selectedId) {
    const targetProject = reportData?.project.id === projectId ? reportData.project : projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    setDownloadingPdf(true);
    try {
      let payloads: ScenarioInputsPayload[];
      let result: CalculateResult;

      if (reportData && reportData.project.id === projectId) {
        payloads = reportData.payloads;
        result = reportData.result;
      } else {
        const rows = await getScenarios(projectId);
        if (!rows || rows.length === 0) return;
        payloads = rows.map((r) => r.inputs as ScenarioInputsPayload);
        result = runAllScenarios(parseCalculateRequest({ scenarios: payloads }));
      }

      generateReportPdf({
        projectName: targetProject.name,
        updatedAt: targetProject.updatedAt,
        payloads,
        result,
      });
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Find best performing scenario
  const bestScenario = reportData?.result.analysis.reduce((best, cur) => {
    if (!cur.simplePaybackYears) return best;
    if (!best || (cur.simplePaybackYears < (best.simplePaybackYears || 999))) return cur;
    return best;
  }, reportData?.result.analysis[1]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 p-6 sm:p-8">
      {/* Header Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports &amp; Executive Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate comprehensive executive reports with multi-graph visual analytics, calculations, and financial ROI models.
          </p>
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Main Generator Card */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-[#1E4FD8]" /> Generate Full Detailed Report
        </h2>

        {filteredProjects.length === 0 ? (
          <p className="text-sm text-slate-500">No project runs found within the selected date range ({dateRange.startDate} to {dateRange.endDate}). Try expanding the date range.</p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Select value={selectedId} onValueChange={(val) => setSelectedId(val)}>
                <SelectTrigger className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20">
                  <SelectValue placeholder="Select a project report..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg py-2.5 font-semibold text-slate-800 focus:bg-blue-50 focus:text-[#1E4FD8]">
                      {p.name} ({p.scenarioCount} Scenarios)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleOpenPreview(selectedId)}
                size="lg"
                style={{ backgroundColor: BLUE }}
                className="gap-2 font-bold text-white shadow hover:opacity-90 cursor-pointer"
              >
                <Eye className="size-4" /> View Interactive Report
              </Button>

              <Button
                onClick={() => handleDownloadPdfDirect(selectedId)}
                disabled={downloadingPdf}
                size="lg"
                variant="outline"
                className="gap-2 border-slate-300 font-semibold cursor-pointer"
              >
                {downloadingPdf ? (
                  <Loader2 className="size-4 animate-spin text-[#1E4FD8]" />
                ) : (
                  <Download className="size-4 text-[#1E4FD8]" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Past Generated Reports Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileText className="size-5 text-[#1E4FD8]" /> Available Project Reports
        </h2>

        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            {projects.length === 0
              ? "No report history available yet."
              : `No project reports recorded between ${dateRange.startDate} and ${dateRange.endDate}.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleOpenPreview(p.id)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1E4FD8]/40 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Calendar className="size-3.5" /> {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#1E4FD8]">
                      {p.scenarioCount} Scenarios
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1E4FD8] transition-colors">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Comprehensive ERV energy, cost, and CO₂ payback report.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-[#1E4FD8]">
                    <Eye className="size-3.5" /> View Report
                  </span>
                  <Link
                    href={`/simulator?projectId=${p.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#1E4FD8] px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Zap className="size-3.5 fill-amber-300 text-amber-300" /> Open in Simulator
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL REPORT PREVIEW MODAL */}
      <ReportPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        projectName={reportData?.project.name}
        updatedAt={reportData?.project.updatedAt}
        payloads={reportData?.payloads || []}
        result={reportData?.result || undefined}
        projectId={reportData?.project.id}
      />
    </div>
  );
}
