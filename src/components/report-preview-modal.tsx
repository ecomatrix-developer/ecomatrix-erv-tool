"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import type { CalculateResult } from "@/lib/calc-engine/types";
import { runAllScenarios } from "@/lib/calc-engine/engine";
import { parseCalculateRequest } from "@/lib/calc-engine/request";
import { generateReportPdf } from "@/lib/generate-report-pdf";
import { AnalysisCharts } from "@/components/analysis-charts";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Loader2,
  X,
  Calendar,
  MapPin,
  Award,
  TrendingDown,
  DollarSign,
  Clock,
  Activity,
  Sliders,
  Zap,
} from "lucide-react";

const BLUE = "#1E4FD8";

export interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  updatedAt?: string;
  payloads: ScenarioInputsPayload[];
  result?: CalculateResult | null;
  projectId?: string;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  projectName = "ERV Project Report",
  updatedAt,
  payloads,
  result,
  projectId,
}: ReportPreviewModalProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute calculation result if not provided
  let calcResult: CalculateResult | null = result || null;
  if (!calcResult && payloads && payloads.length > 0) {
    try {
      calcResult = runAllScenarios(parseCalculateRequest({ scenarios: payloads }));
    } catch (e) {
      console.error("Failed to compute calc result for report preview:", e);
    }
  }

  const bestScenario = calcResult?.analysis.reduce((best, cur) => {
    if (!cur.simplePaybackYears) return best;
    if (!best || cur.simplePaybackYears < (best.simplePaybackYears || 999)) return cur;
    return best;
  }, calcResult?.analysis[1]);

  async function handleDownloadPdf() {
    if (!payloads || payloads.length === 0 || !calcResult) return;
    setDownloadingPdf(true);
    try {
      generateReportPdf({
        projectName,
        updatedAt: updatedAt || new Date().toISOString(),
        payloads,
        result: calcResult,
      });
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 sm:p-6 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl cursor-default"
      >
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <FileText className="size-6 text-[#1E4FD8]" />
            <div>
              <h2 className="text-base font-bold">Executive Engineering Report: {projectName}</h2>
              <p className="text-xs text-slate-300">Energy Recovery Ventilation Multi-Scenario Report</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {projectId && (
              <Link
                href={`/simulator?projectId=${projectId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Zap className="size-4 fill-amber-300 text-amber-300" /> Open in Simulator
              </Link>
            )}

            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || !calcResult}
              size="sm"
              style={{ backgroundColor: BLUE }}
              className="gap-1.5 font-bold text-white shadow-sm hover:opacity-90 cursor-pointer"
            >
              {downloadingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download PDF
            </Button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Printable Report Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100">
          {!calcResult || !payloads || payloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
              <Loader2 className="size-8 animate-spin text-[#1E4FD8] mb-3" />
              <p className="text-sm font-medium">Building detailed calculations, graphs, and analysis...</p>
            </div>
          ) : (
            <div
              id="printable-report-content"
              className="mx-auto max-w-4xl space-y-8 rounded-3xl bg-white p-8 sm:p-10 shadow-lg border border-slate-200"
            >
              {/* 1. REPORT BRANDING & HEADER CARD */}
              <div className="flex flex-col justify-between border-b border-slate-200 pb-6 gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-2">
                    <Image
                      src="/brand/logo.png"
                      alt="Eco Matrix"
                      width={160}
                      height={45}
                      className="h-9 w-auto object-contain"
                    />
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    ENERGY RECOVERY VENTILATION ANALYTICS REPORT
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ECO Matrix Engineering Performance &amp; Payback Assessment
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 min-w-[240px] text-left text-xs text-slate-700 space-y-2 shadow-xs">
                  <div className="border-b border-slate-200/80 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Name</span>
                    <p className="font-extrabold text-slate-900 text-sm">{projectName}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar className="size-3.5 text-slate-400" /> Date
                    </span>
                    <span className="font-bold text-slate-900 whitespace-nowrap">
                      {new Date(updatedAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <MapPin className="size-3.5 text-slate-400" /> Location
                    </span>
                    <span className="font-bold text-slate-900 whitespace-nowrap">
                      {payloads[0]?.city || "Selected Location"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. EXECUTIVE HIGHLIGHTS CARDS */}
              {calcResult.analysis.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Award className="size-4 text-[#1E4FD8]" /> Executive Performance Highlights
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase">
                        <TrendingDown className="size-4" /> Max Energy Reduction
                      </div>
                      <p className="mt-2 text-3xl font-extrabold text-blue-950">
                        {(
                          (calcResult.analysis[1]?.energySavingsPct ?? 0) * 100
                        ).toFixed(1)}
                        %
                      </p>
                      <p className="mt-1 text-xs font-medium text-blue-700">
                        vs BaseCase Conventional HVAC
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase">
                        <DollarSign className="size-4" /> Operational Savings
                      </div>
                      <p className="mt-2 text-3xl font-extrabold text-emerald-950">
                        ${(calcResult.analysis[1]?.operationalCostSaving ?? 0).toLocaleString("en-US")}
                      </p>
                      <p className="mt-1 text-xs font-medium text-emerald-700">Annual cost reduction ($/yr)</p>
                    </div>

                    <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-800 uppercase">
                        <Clock className="size-4" /> Simple Payback
                      </div>
                      <p className="mt-2 text-3xl font-extrabold text-purple-950">
                        {bestScenario?.simplePaybackYears
                          ? `${bestScenario.simplePaybackYears.toFixed(1)} Yrs`
                          : "—"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-purple-700">Return on capital investment</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MULTI-GRAPH VISUAL PERFORMANCE ANALYTICS & AUTOGENERATED WRITEUP */}
              <AnalysisCharts
                analysis={calcResult.analysis}
                scenarios={calcResult.scenarios}
                payloads={payloads}
              />

              {/* 4. DETAILED CALCULATIONS OUTPUT MATRIX */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Activity className="size-4 text-[#1E4FD8]" /> Detailed Stage Calculation Outputs
                </h3>
                
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 text-left">Scenario</th>
                        <th className="p-3 text-left">ERV Tech</th>
                        <th className="p-3 text-right">Preheat (MWh)</th>
                        <th className="p-3 text-right">Post-Heat (MWh)</th>
                        <th className="p-3 text-right">Post-Cool (MWh)</th>
                        <th className="p-3 text-right">Humidification (MWh)</th>
                        <th className="p-3 text-right">Total Energy (MWh)</th>
                        <th className="p-3 text-right">Op Cost ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {calcResult.scenarios.map((s, idx) => {
                        const payload = payloads[idx];
                        return (
                          <tr key={s.scenario} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{s.scenario}</td>
                            <td className="p-3 font-medium text-slate-600">{payload?.ervTech || "—"}</td>
                            <td className="p-3 text-right font-mono">{s.preheatEnergyMwh.toFixed(1)}</td>
                            <td className="p-3 text-right font-mono">{s.postHeatingEnergyMwh.toFixed(1)}</td>
                            <td className="p-3 text-right font-mono">{s.coolingEnergyMwh.toFixed(1)}</td>
                            <td className="p-3 text-right font-mono">{s.humidificationEnergyMwh.toFixed(1)}</td>
                            <td className="p-3 text-right font-bold text-[#1E4FD8] font-mono">{s.totalEnergyMwh.toFixed(1)}</td>
                            <td className="p-3 text-right font-bold text-slate-900 font-mono">${s.totalOperationalCost.toLocaleString("en-US")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. FINANCIAL & ENVIRONMENTAL COMPARATIVE ANALYSIS */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign className="size-4 text-emerald-600" /> Financial ROI &amp; Environmental Summary
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 text-left">Scenario</th>
                        <th className="p-3 text-right">Energy Savings (%)</th>
                        <th className="p-3 text-right">Annual Op Savings ($)</th>
                        <th className="p-3 text-right">Capital Premium ($)</th>
                        <th className="p-3 text-right">Simple Payback (Yrs)</th>
                        <th className="p-3 text-right">CO₂ Reduction (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {calcResult.analysis.map((row) => (
                        <tr key={row.scenario} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{row.scenario}</td>
                          <td className="p-3 text-right font-bold text-[#1E4FD8]">
                            {row.energySavingsPct === null ? "BaseCase" : `${(row.energySavingsPct * 100).toFixed(1)}%`}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            {row.operationalCostSaving === null
                              ? "—"
                              : `$${row.operationalCostSaving.toLocaleString("en-US")}`}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            {row.capitalCostPremium === null
                              ? "—"
                              : `$${row.capitalCostPremium.toLocaleString("en-US")}`}
                          </td>
                          <td className="p-3 text-right font-bold text-purple-800">
                            {row.simplePaybackYears === null
                              ? "—"
                              : `${row.simplePaybackYears.toFixed(1)} Yrs`}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            {row.co2ReductionPct === null ? "—" : `${(row.co2ReductionPct * 100).toFixed(1)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. ENGINEERING INPUT PARAMETERS BREAKDOWN */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Sliders className="size-4 text-slate-700" /> Modeled Input Configuration
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <span className="font-semibold text-slate-500">Supply Airflow:</span>
                      <p className="font-bold text-slate-800">{payloads[0]?.supplyFlow ?? 0} L/s</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Exhaust Airflow:</span>
                      <p className="font-bold text-slate-800">{payloads[0]?.exhaustFlow ?? 0} L/s</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Preheat Threshold:</span>
                      <p className="font-bold text-slate-800">{payloads[0]?.preheatTemp ?? 0} °C</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Electricity Tariff:</span>
                      <p className="font-bold text-slate-800">${payloads[0]?.fuelCostElectricity ?? 0}/kWh</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. FOOTER & DISCLOSURES */}
              <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold">ECO Matrix ERV Performance Engine v2.4 · Official Analytics Report</p>
                <p>© {new Date().getFullYear()} ECO Matrix Solutions. All simulations computed across 8,760 annual climate hours.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
