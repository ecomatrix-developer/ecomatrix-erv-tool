"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProjectAnalyticsData } from "@/app/actions/projects";
import { parseCalculateRequest } from "@/lib/calc-engine/request";
import { runAllScenarios } from "@/lib/calc-engine/engine";
import {
  DateRangePicker,
  getDefaultDateRange,
  isDateInRange,
  type DateRangeValue,
} from "@/components/date-range-picker";
import { ReportPreviewModal } from "@/components/report-preview-modal";
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Download,
  ExternalLink,
  Zap,
  DollarSign,
  Leaf,
  Globe,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  Filter,
  Check,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface OverviewDashboardProps {
  projects: ProjectAnalyticsData[];
}

// Vendor Resource Library Items (SolutionAir, Regencore, Enthalpy Wheel, etc.)
interface ResourceItem {
  id: string;
  title: string;
  category: "Manufacturer Spec" | "Technology Whitepaper" | "Compliance Guide";
  vendor: string;
  tech: string;
  description: string;
  specs: string[];
  pdfUrl?: string;
  isFeatured?: boolean;
}

const VENDOR_RESOURCES: ResourceItem[] = [
  {
    id: "solutionair-regencore",
    title: "SolutionAir Regencore Dual-Core ERV Spec Sheet",
    category: "Manufacturer Spec",
    vendor: "SolutionAir",
    tech: "Regencore Regenerative Core",
    description:
      "Official technical product specifications for SolutionAir Regencore dual-core regenerative heat exchangers. Achieves up to 90% winter sensible effectiveness with zero frost blockage down to -40°C.",
    specs: ["Winter Efficiency: 85-90%", "Latent Recovery: High", "Frost Strategy: Auto-cycling cores", "Airflow Range: 500 - 40,000 CFM"],
    isFeatured: true,
  },
  {
    id: "enthalpy-wheel-guide",
    title: "Rotary Enthalpy Wheel Performance Curves & Selection Guide",
    category: "Technology Whitepaper",
    vendor: "Eco Matrix Engineering",
    tech: "Enthalpy Wheel",
    description:
      "Comprehensive engineering whitepaper on sizing and selecting 3A molecular sieve enthalpy wheels for commercial ventilation systems across North American climate zones.",
    specs: ["Winter Efficiency: 70-75%", "Summer Efficiency: 65-75%", "Pressure Drop: 0.6 - 1.0 in w.g.", "Cross-Contamination: < 0.5%"],
  },
  {
    id: "glycol-runaround-specs",
    title: "Hydronic Glycol Run-Around Energy Recovery System Engineering Specs",
    category: "Manufacturer Spec",
    vendor: "Hydronic Systems Ltd",
    tech: "Glycol Run-Around",
    description:
      "Design guidelines and pump head loss tables for 30% propylene glycol run-around coil loops used in strict zero-cross-contamination laboratory and hospital applications.",
    specs: ["Winter Efficiency: 50-60%", "Contamination Risk: 0%", "Coil Pressure Drop: Medium", "Pump Auxiliary Power: Included"],
  },
  {
    id: "ashrae-901-compliance",
    title: "ASHRAE 90.1 & 62.1 Mechanical Ventilation Energy Standards",
    category: "Compliance Guide",
    vendor: "ASHRAE Standard",
    tech: "General ERV",
    description:
      "Regulatory compliance guide for minimum fan power limitations, exhaust air energy recovery effectiveness mandates, and outdoor air volume requirements.",
    specs: ["Prescriptive Requirement: > 50% effectiveness", "Standard 62.1 Ventilation Rates", "Standard 90.1 Climate Zones 3A-8"],
  },
];

export function OverviewDashboard({ projects }: { projects: OverviewDashboardProps["projects"] }) {
  const [dateRange, setDateRange] = useState<DateRangeValue>(getDefaultDateRange());
  const [selectedTab, setSelectedTab] = useState<"projects" | "resources">("projects");
  const [resourceCategory, setResourceCategory] = useState<string>("All");
  const [previewProject, setPreviewProject] = useState<any>(null);

  // Local state to track finalized selections per project (persisted in localStorage)
  const [finalizedSelections, setFinalizedSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("erv_finalized_selections");
      if (saved) setFinalizedSelections(JSON.parse(saved));
    } catch {}
  }, []);

  function handleMarkSelection(projectId: string, optionLabel: string) {
    const updated = { ...finalizedSelections, [projectId]: optionLabel };
    setFinalizedSelections(updated);
    try {
      localStorage.setItem("erv_finalized_selections", JSON.stringify(updated));
    } catch {}
  }

  // Filter projects by date range
  const filteredProjects = projects.filter((p) =>
    isDateInRange(p.updatedAt, dateRange.startDate, dateRange.endDate)
  );

  // Compute Project Statuses & Honest Per-Project Metrics
  let awaitingDecisionCount = 0;
  let finalizedCount = 0;
  let totalOptionsEvaluated = 0;
  let aggregateSelectedSavings = 0;

  const processedProjects = filteredProjects.map((p) => {
    const optionCount = p.scenarios ? Math.max(0, p.scenarios.length - 1) : 0;
    totalOptionsEvaluated += optionCount;

    const chosenOption = finalizedSelections[p.id] || null;
    const hasMultipleOptions = optionCount >= 1;

    let status: "awaiting" | "finalized" | "draft" = "draft";
    if (chosenOption) {
      status = "finalized";
      finalizedCount++;
    } else if (hasMultipleOptions) {
      status = "awaiting";
      awaitingDecisionCount++;
    }

    // Run engine analysis for this project
    let calcScenarios: (typeof p.scenarios)[number]["outputs"][] = [];
    let calcAnalysis: ReturnType<typeof runAllScenarios>["analysis"] = [];

    if (p.scenarios && p.scenarios.length > 0) {
      try {
        const payloads = p.scenarios.map((s) => s.inputs);
        const res = runAllScenarios(parseCalculateRequest({ scenarios: payloads }));
        calcScenarios = res.scenarios;
        calcAnalysis = res.analysis;
      } catch {
        calcScenarios = p.scenarios.map((s) => s.outputs);
      }
    }

    // If project is finalized, add its specific chosen option savings to aggregate savings
    let chosenOptionSavings = 0;
    let chosenTechName = "—";

    if (chosenOption && calcAnalysis.length > 1) {
      const matchedRow = calcAnalysis.find((r) => r.scenario === chosenOption);
      const matchedScenarioIdx = p.scenarios.findIndex((s) => s.label === chosenOption);
      if (matchedRow && matchedRow.operationalCostSaving) {
        chosenOptionSavings = matchedRow.operationalCostSaving;
        aggregateSelectedSavings += chosenOptionSavings;
      }
      if (matchedScenarioIdx >= 0) {
        chosenTechName = p.scenarios[matchedScenarioIdx]?.inputs?.ervTech || chosenOption;
      }
    }

    return {
      ...p,
      city: p.scenarios[0]?.inputs?.city || "Selected City",
      optionCount,
      status,
      chosenOption,
      chosenTechName,
      chosenOptionSavings,
      calcAnalysis,
      calcScenarios,
    };
  });

  const filteredResources = VENDOR_RESOURCES.filter(
    (r) => resourceCategory === "All" || r.category === resourceCategory
  );

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 p-6 sm:p-8">
      {/* Top Banner Header with Status Summary */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#1E4FD8] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-md mb-2">
            <Sparkles className="size-3.5 text-blue-300" /> ERV Project Management Portal
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Project Overview &amp; Decisions
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Track active ERV project runs, finalize technology selections, and access engineering vendor spec sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* 1. HONEST PER-PROJECT STATUS CARDS (Replacing Decorative Aggregate Averages) */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Projects */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E4FD8]">
              <FolderKanban className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{processedProjects.length}</p>
          <p className="mt-1 text-xs text-slate-500 font-medium">Projects in workspace</p>
        </div>

        {/* Card 2: Awaiting Decision (Nudge Metric) */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Decision</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-950">{awaitingDecisionCount}</p>
          <p className="mt-1 text-xs text-amber-800 font-bold">Needs winning option marked</p>
        </div>

        {/* Card 3: Finalized Choices */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Finalized Choices</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-950">{finalizedCount}</p>
          <p className="mt-1 text-xs text-emerald-800 font-medium">Decision finalized &amp; saved</p>
        </div>

        {/* Card 4: Selected Savings (Honest Summed Savings) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Finalized Savings</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            ${Math.round(aggregateSelectedSavings).toLocaleString("en-US")} <span className="text-xs font-normal text-slate-500">/yr</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">From finalized ERV selections</p>
        </div>
      </div>

      {/* 2. UNFINISHED DECISION ALERT NUDGE BANNER (Product Conversion Nudge) */}
      {awaitingDecisionCount > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white shrink-0 mt-0.5">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">
                {awaitingDecisionCount} Project{awaitingDecisionCount > 1 ? "s" : ""} Awaiting Final Decision
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                You have projects with multiple ERV options simulated but no marked winning technology selection. Mark your final decision below to close the loop!
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedTab("projects");
              const el = document.getElementById("projects-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            size="sm"
            className="bg-white font-bold text-amber-950 hover:bg-amber-100 shadow-sm shrink-0 cursor-pointer"
          >
            Review Decisions Below <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* MAIN CONTENT NAVIGATION TABS (Projects vs Vendor Resources) */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedTab("projects")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              selectedTab === "projects"
                ? "bg-[#1E4FD8] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FolderKanban className="size-4" /> Project Workspaces ({processedProjects.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("resources")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              selectedTab === "resources"
                ? "bg-[#1E4FD8] text-white shadow"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <BookOpen className="size-4" /> ERV Vendor &amp; Spec Library
            <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-slate-950 uppercase">
              Partner Specs
            </span>
          </button>
        </div>

        <Link
          href="/simulator"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          + New Project Simulation
        </Link>
      </div>

      {/* TAB 1: PROJECT WORKSPACES & DECISION TRACKER */}
      {selectedTab === "projects" && (
        <div id="projects-section" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="size-5 text-[#1E4FD8]" /> Project Workspaces &amp; Selection Tracker
                </h2>
                <p className="text-xs text-slate-500">
                  Quickly resume work, run comparative simulations, and finalize winning ERV design choices.
                </p>
              </div>
            </div>

            {processedProjects.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No active projects found within the selected date range ({dateRange.startDate} to {dateRange.endDate}).
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {processedProjects.map((p) => {
                  const isAwaiting = p.status === "awaiting";
                  const isFinalized = p.status === "finalized";

                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-sm ${
                        isAwaiting
                          ? "border-amber-300 bg-amber-50/30 hover:border-amber-400"
                          : isFinalized
                          ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Clock className="size-3" /> {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>

                          {isAwaiting && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">
                              <AlertCircle className="size-3" /> Awaiting Decision
                            </span>
                          )}

                          {isFinalized && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="size-3" /> Finalized
                            </span>
                          )}

                          {!isAwaiting && !isFinalized && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-100">
                              Draft / Initializing
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 truncate" title={p.name}>
                          {p.name}
                        </h3>

                        <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="size-3.5 text-slate-400" /> Location: <span className="font-bold text-slate-800">{p.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Layers className="size-3.5 text-slate-400" /> Options Evaluated: <span className="font-bold text-slate-800">{p.optionCount} Scenarios</span>
                          </div>
                        </div>

                        {/* Finalized Choice Summary if available */}
                        {isFinalized && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3 text-xs space-y-1">
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Selected ERV Technology</span>
                            <p className="font-extrabold text-slate-900">{p.chosenOption}: {p.chosenTechName}</p>
                            {p.chosenOptionSavings > 0 && (
                              <p className="text-emerald-700 font-bold text-[11px]">
                                Projected Savings: ${Math.round(p.chosenOptionSavings).toLocaleString("en-US")}/yr
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-2">
                        {/* Quick Mark Winner Dropdown */}
                        {p.optionCount > 0 && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={p.chosenOption || ""}
                              onValueChange={(val) => handleMarkSelection(p.id, val)}
                            >
                              <SelectTrigger className="h-8 text-xs font-semibold border-slate-300 bg-white">
                                <SelectValue placeholder={isAwaiting ? "⚡ Mark Final Decision..." : "Change Selection..."}>
                                  {p.chosenOption ? (
                                    (() => {
                                      const selectedScenario = p.scenarios.find((s) => s.label === p.chosenOption);
                                      const techName = selectedScenario?.inputs?.ervTech?.trim();
                                      return techName ? `${p.chosenOption} (${techName})` : p.chosenOption;
                                    })()
                                  ) : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {p.scenarios.slice(1).map((s) => {
                                  const techName = s.inputs?.ervTech?.trim();
                                  const techLabel = techName ? ` (${techName})` : "";
                                  return (
                                    <SelectItem key={s.label} value={s.label} className="text-xs font-bold">
                                      Finalize {s.label}{techLabel}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/simulator?projectId=${p.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[#1E4FD8] py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <Zap className="size-3.5 fill-amber-300 text-amber-300" /> Open Simulator
                          </Link>

                          <button
                            type="button"
                            onClick={() => setPreviewProject(p)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-[#1E4FD8] hover:text-[#1E4FD8] transition-colors cursor-pointer"
                            title="View Visual Analytics Report"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ERV VENDOR & TECHNICAL SPECIFICATION LIBRARY */}
      {selectedTab === "resources" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="size-5 text-[#1E4FD8]" /> ERV Vendor &amp; Technical Spec Library
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Access manufacturer-verified product specification sheets, technology selection whitepapers, and climate compliance standards.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Filter className="size-3.5" /> Category:
                </span>
                <Select value={resourceCategory} onValueChange={setResourceCategory}>
                  <SelectTrigger className="h-9 w-44 rounded-xl border-slate-300 text-xs font-semibold bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Manufacturer Spec">Manufacturer Specs</SelectItem>
                    <SelectItem value="Technology Whitepaper">Whitepapers</SelectItem>
                    <SelectItem value="Compliance Guide">Compliance Guides</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Featured Vendor Highlight Banner (Partner Placement) */}
            <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-900 via-slate-900 to-[#1E4FD8] p-6 text-white shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider mb-2">
                    ⭐ Featured Partner Technology
                  </span>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    SolutionAir Regencore — Dual-Core Regenerative ERV Specs
                  </h3>
                  <p className="text-xs text-blue-200 max-w-2xl mt-1 leading-relaxed">
                    Access certified performance curve datasets, heat exchanger effectiveness tables, and winter defrost cycling parameters for SolutionAir Regencore units directly integrated into the ECO Matrix performance engine.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <Button
                    onClick={() => alert("Downloading SolutionAir Regencore Certified Performance Spec Sheet (PDF)...")}
                    size="sm"
                    className="bg-amber-400 font-extrabold text-slate-950 hover:bg-amber-300 shadow cursor-pointer"
                  >
                    <Download className="size-4 mr-1" /> Download Spec Sheet
                  </Button>
                </div>
              </div>
            </div>

            {/* Resource Library Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition-all hover:border-[#1E4FD8]/40 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#1E4FD8]">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{item.vendor}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 mb-4">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Key Performance Specifications</span>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold text-slate-700">
                        {item.specs.map((spec, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Check className="size-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 mt-2">
                    <span className="text-xs font-bold text-[#1E4FD8] flex items-center gap-1">
                      <ShieldCheck className="size-4 text-emerald-600" /> Verified Data
                    </span>

                    <Button
                      onClick={() => alert(`Opening ${item.title} technical document...`)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-bold border-slate-300 hover:border-[#1E4FD8] cursor-pointer"
                    >
                      <ExternalLink className="size-3.5" /> View Specs
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REPORT PREVIEW MODAL */}
      <ReportPreviewModal
        isOpen={previewProject !== null}
        onClose={() => setPreviewProject(null)}
        projectName={previewProject?.name}
        updatedAt={previewProject?.updatedAt}
        payloads={previewProject?.scenarios?.map((s: any) => s.inputs) || []}
        result={
          previewProject
            ? {
                scenarios: previewProject.calcScenarios,
                analysis: previewProject.calcAnalysis,
              }
            : undefined
        }
        projectId={previewProject?.id}
      />
    </div>
  );
}
