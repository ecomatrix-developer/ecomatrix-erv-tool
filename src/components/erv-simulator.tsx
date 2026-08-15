"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DEFAULT_FORM_STATE, type FormState } from "@/lib/form-defaults";
import { formStateToPayload } from "@/lib/form-to-payload";
import { payloadToFormState } from "@/lib/payload-to-form";
import type { AnalysisRow, ScenarioOutputs } from "@/lib/calc-engine/types";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import { saveScenarios } from "@/app/actions/projects";
import { ProjectNameModal } from "@/components/project-name-modal";
import { setHasUnsavedChanges } from "@/lib/unsaved-changes-store";
import { DashboardCard } from "@/components/dashboard-card";
import { LocationPicker } from "@/components/location-picker";
import { SchedulePicker } from "@/components/schedule-picker";
import { Field, TextInput, NumberInput, YesNoSelect, FuelSourceSelect } from "@/components/stage-fields";
import { EditableInputsTable, AnalysisTable } from "@/components/results-table";
import { AnalysisCharts } from "@/components/analysis-charts";
import { ReportPreviewModal } from "@/components/report-preview-modal";
import { BrandLoader } from "@/components/brand-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FolderKanban, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENARIO_LABELS = ["BaseCase", "Option 1", "Option 2", "Option 3", "Option 4"];
const HEADER_BLUE = "#5b73e8";

interface ErvSimulatorProps {
  initialProjectId?: string;
  initialProjectName?: string;
  initialPayloads?: ScenarioInputsPayload[];
  initialScenarios?: ScenarioOutputs[];
}

export function ErvSimulator({
  initialProjectId,
  initialProjectName,
  initialPayloads,
  initialScenarios,
}: ErvSimulatorProps) {
  const [projectId, setProjectId] = useState<string | null>(initialProjectId ?? null);
  const [projectName, setProjectName] = useState<string>(initialProjectName ?? "");
  const [showNameModal, setShowNameModal] = useState<boolean>(!initialProjectId);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE);
  const [payloads, setPayloads] = useState<ScenarioInputsPayload[]>(initialPayloads ?? []);
  const [scenarios, setScenarios] = useState<ScenarioOutputs[]>(initialScenarios ?? []);
  const [analysis, setAnalysis] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showInputs, setShowInputs] = useState<boolean>((initialPayloads?.length ?? 0) > 0);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ScenarioInputsPayload | null>(null);
  const [recalcIndex, setRecalcIndex] = useState<number | null>(null);
  const [analysisClicked, setAnalysisClicked] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  const currentIndex = payloads.length;
  const currentLabel = SCENARIO_LABELS[currentIndex];
  const canSubmit = currentIndex < SCENARIO_LABELS.length && form.city !== "";
  const done = currentIndex >= SCENARIO_LABELS.length;
  const isEditingRow = editingIndex !== null;

  // A loaded project only has its scenario outputs persisted, not the cross-scenario
  // analysis (savings %, payback) -- recompute it once on load so Analysis isn't empty.
  useEffect(() => {
    if (!initialPayloads || initialPayloads.length === 0) return;
    let cancelled = false;
    fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarios: initialPayloads }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!cancelled && result) setAnalysis(result.analysis);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The sidebar (rendered outside this component's tree) reads this flag to warn
  // before navigating away from scenario work that hasn't reached Supabase yet.
  useEffect(() => {
    setHasUnsavedChanges(true);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      setHasUnsavedChanges(false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  async function persist(nextPayloads: ScenarioInputsPayload[], nextScenarios: ScenarioOutputs[]) {
    if (!projectId) return;
    const result = await saveScenarios(
      projectId,
      nextPayloads.map((p, i) => ({ label: p.scenario, inputs: p, outputs: nextScenarios[i] ?? null })),
    );
    if ("error" in result) {
      setSaveNotice(`Saved locally, but failed to sync to project: ${result.error}`);
    } else {
      setSaveNotice("Saved to project.");
      setHasUnsavedChanges(true);
      setTimeout(() => setSaveNotice(null), 2500);
    }
  }

  async function runScenario() {
    if (!currentLabel) return;
    if (!projectId) {
      setShowNameModal(true);
      setError("Please name your project before running the calculation.");
      return;
    }
    setLoading(true);
    setError(null);

    const nextPayloads = [...payloads, formStateToPayload(form, currentLabel)];

    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarios: nextPayloads }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
      const result = await res.json();
      setPayloads(nextPayloads);
      setScenarios(result.scenarios);
      setAnalysis(result.analysis);
      setShowInputs(true);
      setHasUnsavedChanges(true);
      persist(nextPayloads, result.scenarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPayloads([]);
    setScenarios([]);
    setAnalysis([]);
    setError(null);
    setForm(DEFAULT_FORM_STATE);
    setShowInputs(false);
    setHasUnsavedChanges(false);
    setAnalysisClicked(false);
  }

  function startEditRow(index: number) {
    setEditingIndex(index);
    setDraft({ ...payloads[index] });
    setHasUnsavedChanges(true);
  }

  function cancelEditRow() {
    setEditingIndex(null);
    setDraft(null);
    setHasUnsavedChanges(false);
  }

  function updateDraft(next: ScenarioInputsPayload) {
    setDraft(next);
  }

  function updateDraftFromForm(nextForm: FormState) {
    if (!draft) return;
    setDraft(formStateToPayload(nextForm, draft.scenario));
  }

  async function recalculateEditingRow(index: number) {
    if (!draft) return;
    const nextPayloads = payloads.map((p, i) => (i === index ? draft : p));
    setError(null);
    setRecalcIndex(index);

    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarios: nextPayloads }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }
      const result = await res.json();
      setPayloads(nextPayloads);
      setScenarios(result.scenarios);
      setAnalysis(result.analysis);
      setEditingIndex(null);
      setDraft(null);
      setHasUnsavedChanges(true);
      persist(nextPayloads, result.scenarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setRecalcIndex(null);
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const activeForm = isEditingRow && draft ? payloadToFormState(draft, form) : form;
  const activeSet = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    isEditingRow ? updateDraftFromForm({ ...activeForm, [key]: value }) : set(key, value);
  const preheatOff = activeForm.preheatFlag === "NO";
  const humidificationOff = activeForm.humidificationFlag === "NO";
  const disableInputs = loading || (done && !isEditingRow) || recalcIndex !== null;
  const cardsLocked = analysisClicked && !isEditingRow;
  const cardsDisabled = disableInputs || cardsLocked;

  // Only fields the results table itself also lets you edit stay live while editing a
  // row from the table; every other card dims and every other field within an active
  // card locks, so it's unambiguous which values a table edit will actually change.
  const CARDS_WITH_TABLE_FIELDS = new Set([
    "location",
    "preheat",
    "erv",
    "heating",
    "cooling",
    "humid",
    "ghg",
    "fuel",
    "airflow",
  ]);
  const cardHighlight = (area: string) =>
    isEditingRow ? (CARDS_WITH_TABLE_FIELDS.has(area) ? "active" : "dim") : (cardsLocked ? "dim" : undefined);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <ProjectNameModal
        open={showNameModal && !projectId}
        onCreated={(id, name) => {
          setProjectId(id);
          setProjectName(name);
          setShowNameModal(false);
        }}
      />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-auto p-2">
        <div className="flex w-full flex-col gap-2">
          {/* Row 1: Location + the 6 system cards, all stretched to match Location's height */}
          <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3 lg:grid-cols-7">
            <DashboardCard title="Location" highlight={cardHighlight("location")}>
              <LocationPicker
                region={activeForm.region}
                country={activeForm.country}
                province={activeForm.province}
                city={activeForm.city}
                customWeather={activeForm.customWeather}
                disabled={cardsDisabled}
                onChange={(next) => (isEditingRow ? updateDraftFromForm({ ...activeForm, ...next }) : setForm({ ...form, ...next }))}
                compact
              />
            </DashboardCard>

            <DashboardCard title="Preheat System" highlight={cardHighlight("preheat")}>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Enable Preheat" dim={isEditingRow}>
                  <YesNoSelect value={activeForm.preheatFlag} onChange={(v) => activeSet("preheatFlag", v)} disabled={isEditingRow || cardsDisabled} />
                </Field>
                <Field label="Temp (°C / °F)">
                  <NumberInput value={activeForm.preheatTemp} onChange={(v) => activeSet("preheatTemp", v)} unitType="temperature" disabled={(preheatOff && !isEditingRow) || cardsDisabled} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Coil COP">
                  <NumberInput value={activeForm.copPreheat} onChange={(v) => activeSet("copPreheat", v)} disabled={(preheatOff && !isEditingRow) || cardsDisabled} />
                </Field>
                <Field label="Cost ($)" dim={isEditingRow}>
                  <NumberInput value={activeForm.preheatCost} onChange={(v) => activeSet("preheatCost", v)} disabled={preheatOff || isEditingRow || cardsDisabled} />
                </Field>
              </div>
              <Field label="Fuel Source">
                <FuelSourceSelect value={activeForm.preheatFuelSource} onChange={(v) => activeSet("preheatFuelSource", v)} disabled={(preheatOff && !isEditingRow) || cardsDisabled} />
              </Field>
            </DashboardCard>

            <DashboardCard title="ERV Technology" highlight={cardHighlight("erv")}>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Technology">
                  <TextInput value={activeForm.ervTech} onChange={(v) => activeSet("ervTech", v)} placeholder="e.g. Enthalpy Wheel" disabled={cardsDisabled} />
                </Field>
                <Field label="Cost ($)" dim={isEditingRow}>
                  <NumberInput value={activeForm.ervTechCost} onChange={(v) => activeSet("ervTechCost", v)} disabled={isEditingRow || cardsDisabled} />
                </Field>
              </div>

              <div className="mt-0.5 rounded border border-slate-200 bg-slate-50 p-1">
                <p className="mb-0.5 text-[0.58rem] font-bold tracking-wide text-slate-500 uppercase">
                  Sensible EFF (%)
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <Field label="Winter">
                    <NumberInput value={activeForm.winterSensibleEff} onChange={(v) => activeSet("winterSensibleEff", v)} disabled={cardsDisabled} />
                  </Field>
                  <Field label="Summer">
                    <NumberInput value={activeForm.summerSensibleEff} onChange={(v) => activeSet("summerSensibleEff", v)} disabled={cardsDisabled} />
                  </Field>
                </div>
              </div>

              <div className="mt-0.5 rounded border border-slate-200 bg-slate-50 p-1">
                <p className="mb-0.5 text-[0.58rem] font-bold tracking-wide text-slate-500 uppercase">
                  Latent EFF (%)
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <Field label="Winter">
                    <NumberInput value={activeForm.winterLatentEff} onChange={(v) => activeSet("winterLatentEff", v)} disabled={cardsDisabled} />
                  </Field>
                  <Field label="Summer">
                    <NumberInput value={activeForm.summerLatentEff} onChange={(v) => activeSet("summerLatentEff", v)} disabled={cardsDisabled} />
                  </Field>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Post ERV Heating" highlight={cardHighlight("heating")}>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Setpoint (°C)" dim={isEditingRow}>
                  <NumberInput value={activeForm.postHeatSetpoint} onChange={(v) => activeSet("postHeatSetpoint", v)} unitType="temperature" disabled={isEditingRow || cardsDisabled} />
                </Field>
                <Field label="Coil COP">
                  <NumberInput value={activeForm.copPostheat} onChange={(v) => activeSet("copPostheat", v)} disabled={cardsDisabled} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Fuel Source">
                  <FuelSourceSelect value={activeForm.postheatFuelSource} onChange={(v) => activeSet("postheatFuelSource", v)} disabled={cardsDisabled} />
                </Field>
                <Field label="Cost ($)" dim={isEditingRow}>
                  <NumberInput value={activeForm.postErvHeatingCost} onChange={(v) => activeSet("postErvHeatingCost", v)} disabled={isEditingRow || cardsDisabled} />
                </Field>
              </div>
            </DashboardCard>

            <DashboardCard title="Post ERV Cooling" highlight={cardHighlight("cooling")}>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Setpoint (°C)" dim={isEditingRow}>
                  <NumberInput value={activeForm.postCoolSetpoint} onChange={(v) => activeSet("postCoolSetpoint", v)} unitType="temperature" disabled={isEditingRow || cardsDisabled} />
                </Field>
                <Field label="Coil COP">
                  <NumberInput value={activeForm.copCooling} onChange={(v) => activeSet("copCooling", v)} disabled={cardsDisabled} />
                </Field>
              </div>
              <Field label="Cost ($)" dim={isEditingRow}>
                <NumberInput value={activeForm.postErvCoolingCost} onChange={(v) => activeSet("postErvCoolingCost", v)} disabled={isEditingRow || cardsDisabled} />
              </Field>
            </DashboardCard>

            <DashboardCard title="Humidification" highlight={cardHighlight("humid")}>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Enable" dim={isEditingRow}>
                  <YesNoSelect value={activeForm.humidificationFlag} onChange={(v) => activeSet("humidificationFlag", v)} disabled={isEditingRow || cardsDisabled} />
                </Field>
                <Field label="RH Setpoint (%)" dim={isEditingRow}>
                  <NumberInput value={activeForm.rhSetpoint} onChange={(v) => activeSet("rhSetpoint", v)} disabled={humidificationOff || isEditingRow || cardsDisabled} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Field label="Coil COP">
                  <NumberInput value={activeForm.copHumidification} onChange={(v) => activeSet("copHumidification", v)} disabled={(humidificationOff && !isEditingRow) || cardsDisabled} />
                </Field>

                <Field label="Cost ($)" dim={isEditingRow}>
                  <NumberInput value={activeForm.humidificationCost} onChange={(v) => activeSet("humidificationCost", v)} disabled={humidificationOff || isEditingRow || cardsDisabled} />
                </Field>
              </div>
              <Field label="Fuel Source">
                <FuelSourceSelect value={activeForm.humidificationFuelSource} onChange={(v) => activeSet("humidificationFuelSource", v)} disabled={(humidificationOff && !isEditingRow) || cardsDisabled} />
              </Field>
            </DashboardCard>

            <DashboardCard title="Operating Schedule" highlight={cardHighlight("schedule")} className="relative z-20">
              <SchedulePicker
                hours={activeForm.hours}
                days={activeForm.days}
                months={activeForm.months}
                onChange={(next) => (isEditingRow ? updateDraftFromForm({ ...activeForm, ...next }) : setForm({ ...form, ...next }))}
                compact
                disabled={isEditingRow || cardsDisabled}
              />
            </DashboardCard>
          </div>

          {/* Row 2: GHG & Fuel Cost (left) + schematic + Air Flow & Project 2-column (right) */}
          <div className="flex gap-2 items-start">
            {/* Left: GHG + Fuel Cost */}
            <div className="flex w-[260px] shrink-0 flex-col gap-2">
              <div className="grid grid-cols-2 gap-1.5">
                <DashboardCard title="GHG (kg CO2/kWh)" highlight={cardHighlight("ghg")}>
                  <Field label="Electricity">
                    <NumberInput value={activeForm.ghgElectricity} onChange={(v) => activeSet("ghgElectricity", v)} disabled={cardsDisabled} />
                  </Field>
                  <Field label="Natural Gas">
                    <NumberInput value={activeForm.ghgNaturalGas} onChange={(v) => activeSet("ghgNaturalGas", v)} disabled={cardsDisabled} />
                  </Field>
                </DashboardCard>

                <DashboardCard title="Fuel Cost ($/kWh)" highlight={cardHighlight("fuel")}>
                  <Field label="Electricity">
                    <NumberInput value={activeForm.fuelCostElectricity} onChange={(v) => activeSet("fuelCostElectricity", v)} disabled={cardsDisabled} />
                  </Field>
                  <Field label="Natural Gas">
                    <NumberInput value={activeForm.fuelCostNaturalGas} onChange={(v) => activeSet("fuelCostNaturalGas", v)} disabled={cardsDisabled} />
                  </Field>
                </DashboardCard>
              </div>
            </div>

            {/* Center & Right area: ERV Diagram + Air Flow & Project 2-column group */}
            <div className="flex min-w-0 flex-1 gap-2 items-center">
              {/* ERV Diagram */}
              <div className="flex flex-1 flex-col items-center">
                <div className="w-full flex justify-center">
                  <Image
                    src="/brand/erv-diagram.png"
                    alt="ERV airflow diagram"
                    width={1000}
                    height={320}
                    className="h-auto max-h-[190px] w-full object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Right 2 columns: Air Flow Parameters + Project */}
              <div className="grid grid-cols-2 gap-2 w-[340px] shrink-0 self-start">
                <DashboardCard title="Air Flow Parameters" highlight={cardHighlight("airflow")}>
                  <Field label="Supply (L/s / CFM)">
                    <NumberInput value={activeForm.supplyFlow} onChange={(v) => activeSet("supplyFlow", v)} unitType="flow" disabled={cardsDisabled} />
                  </Field>
                  <Field label="Exhaust (L/s / CFM)">
                    <NumberInput value={activeForm.exhaustFlow} onChange={(v) => activeSet("exhaustFlow", v)} unitType="flow" disabled={cardsDisabled} />
                  </Field>
                  {activeForm.exhaustFlow > activeForm.supplyFlow && (
                    <p className="text-[0.65rem] font-semibold text-red-500">Exhaust should not exceed supply.</p>
                  )}
                </DashboardCard>

                <DashboardCard title="Project" highlight={cardHighlight("project")}>
                  <div className="flex flex-col justify-between h-full gap-2 p-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-[#1E4FD8] shrink-0 border border-blue-100">
                        <FolderKanban className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Project</span>
                        <p className="text-xs font-bold text-slate-900 truncate" title={projectName || "Untitled Project"}>
                          {projectName || "Untitled Project"}
                        </p>
                      </div>
                    </div>
                    {!projectId ? (
                      <button
                        type="button"
                        onClick={() => setShowNameModal(true)}
                        className="w-full rounded-md border border-blue-200 bg-blue-50/70 py-1 text-[11px] font-bold text-[#1E4FD8] hover:bg-blue-100 transition-colors text-center cursor-pointer"
                      >
                        + Name Project
                      </button>
                    ) : (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-medium text-slate-500">Status</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Saved
                        </span>
                      </div>
                    )}
                  </div>
                </DashboardCard>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {saveNotice && <p className="text-center text-xs font-semibold text-slate-400">{saveNotice}</p>}

          {/* Initial Create Option Action Bar (shown when Results Table is not visible yet) */}
          {!showInputs && !done && (
            <div className="relative flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              {loading && (
                <BrandLoader
                  overlay
                  size="sm"
                  text={`Simulating ${currentLabel}...`}
                  subtext="Calculating 8,760 annual hours..."
                />
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Ready to simulate?
                </span>
                <span className="text-xs text-slate-500">
                  Configure the parameters above and click to create {currentLabel}.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={runScenario}
                  disabled={!canSubmit || disableInputs}
                  className="rounded-md px-5 py-2 text-xs font-bold text-white shadow transition-all hover:bg-blue-600 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: HEADER_BLUE }}
                >
                  {loading ? "Calculating…" : `Create ${currentLabel}`}
                </button>
                {!canSubmit && (
                  <p className="text-xs font-semibold text-slate-400">Select a city to continue.</p>
                )}
              </div>
            </div>
          )}

          {/* Results: full page width, below the input columns */}
          {showInputs && (scenarios.length > 0 || !done) && (
            <div className={cn("relative rounded-lg border border-slate-200 bg-white p-2 shadow-sm")}>
              {(loading || recalcIndex !== null) && (
                <BrandLoader
                  overlay
                  size="md"
                  text={recalcIndex !== null ? "Recalculating Scenario..." : `Simulating ${currentLabel}...`}
                  subtext="Running 8,760-hour thermodynamic energy calculations..."
                />
              )}
              <Tabs defaultValue="inputs" onValueChange={(val) => { if (val === "analysis") setAnalysisClicked(true); }}>
                <div className="flex items-center justify-between gap-3 mb-1.5 px-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-extrabold text-slate-900">Results</h2>
                    <TabsList className="h-7 p-0.5 bg-slate-100">
                      <TabsTrigger value="inputs" className="h-6 text-xs px-2.5">Inputs &amp; Energy</TabsTrigger>
                      <TabsTrigger value="analysis" disabled={isEditingRow || scenarios.length === 0} className="h-6 text-xs px-2.5 gap-1">
                        {isEditingRow && <Lock className="size-3" />}
                        Analysis
                      </TabsTrigger>
                    </TabsList>
                    {analysisClicked && scenarios.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setReportModalOpen(true)}
                        className="h-7 rounded-md bg-[#1E4FD8] px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-1.5 animate-in fade-in"
                      >
                        <Eye className="size-3.5" /> View Report
                      </button>
                    )}
                  </div>

                  {isEditingRow && (
                    <div className="flex-1 text-center">
                      <span className="text-[11px] font-semibold text-slate-400">
                        Analysis is locked until this row is recalculated.
                      </span>
                    </div>
                  )}

                  {/* Actions inside Results Header at top right */}
                  <div className="flex items-center gap-2">
                    {isEditingRow ? (
                      <>
                        <button
                          type="button"
                          onClick={() => editingIndex !== null && recalculateEditingRow(editingIndex)}
                          disabled={recalcIndex !== null}
                          className="rounded-md px-4 py-1 text-xs font-bold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                          style={{ backgroundColor: HEADER_BLUE }}
                        >
                          {recalcIndex !== null ? "Recalculating…" : "Recalculate"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditRow}
                          disabled={recalcIndex !== null}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-slate-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!done && (
                          <button
                            type="button"
                            onClick={runScenario}
                            disabled={!canSubmit || disableInputs}
                            className="rounded-md px-4 py-1 text-xs font-bold text-white shadow transition-opacity hover:bg-blue-600 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            style={{ backgroundColor: HEADER_BLUE }}
                          >
                            {loading ? "Calculating…" : `Create ${currentLabel}`}
                          </button>
                        )}
                        {payloads.length > 0 && (
                          <button
                            type="button"
                            onClick={reset}
                            disabled={loading}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:border-slate-400 cursor-pointer"
                          >
                            Start Over
                          </button>
                        )}
                        {!canSubmit && !done && !analysisClicked && (
                          <p className="text-xs font-semibold text-slate-400">Select a city to continue.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <TabsContent value="inputs" className="mt-0">
                  <EditableInputsTable
                    payloads={payloads}
                    scenarios={scenarios}
                    editingIndex={editingIndex}
                    draft={draft}
                    recalcIndex={recalcIndex}
                    onStartEdit={startEditRow}
                    onCancelEdit={cancelEditRow}
                    onDraftChange={updateDraft}
                    onRecalculate={recalculateEditingRow}
                  />
                </TabsContent>
                <TabsContent value="analysis" className="mt-0 space-y-4">
                  <AnalysisTable analysis={analysis} />
                  <AnalysisCharts analysis={analysis} scenarios={scenarios} payloads={payloads} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <ReportPreviewModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        projectName={projectName || "ERV Simulation Project"}
        payloads={payloads}
        result={{ scenarios, analysis }}
        projectId={projectId || undefined}
      />
    </div>
  );
}
