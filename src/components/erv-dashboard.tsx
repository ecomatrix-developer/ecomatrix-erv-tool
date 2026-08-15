"use client";

import { useState } from "react";
import { DEFAULT_FORM_STATE, type FormState } from "@/lib/form-defaults";
import { formStateToPayload } from "@/lib/form-to-payload";
import { payloadToFormState } from "@/lib/payload-to-form";
import type { AnalysisRow, ScenarioOutputs } from "@/lib/calc-engine/types";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import { ErvCanvas } from "@/components/erv-canvas";
import { EditableInputsTable, AnalysisTable } from "@/components/results-table";
import { ScenarioStepper } from "@/components/scenario-stepper";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Lock, PartyPopper, Pencil, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SCENARIO_LABELS = ["BaseCase", "Option 1", "Option 2", "Option 3", "Option 4"];
const BLUE = "#1E4FD8";

export function ErvDashboard() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE);
  const [payloads, setPayloads] = useState<ScenarioInputsPayload[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioOutputs[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Row-edit state: editing a completed scenario's inputs from the results table.
  // The draft is shared between the table's inline cells and the canvas above it,
  // so typing in either place updates the same object. Analysis is locked while a
  // row is being edited since its savings/payback figures compare against
  // BaseCase and would otherwise silently go stale.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ScenarioInputsPayload | null>(null);
  const [recalcIndex, setRecalcIndex] = useState<number | null>(null);

  const currentIndex = payloads.length;
  const currentLabel = SCENARIO_LABELS[currentIndex];
  const canSubmit = currentIndex < SCENARIO_LABELS.length && form.city !== "";
  const done = currentIndex >= SCENARIO_LABELS.length;
  const isEditingRow = editingIndex !== null;

  async function runScenario() {
    if (!currentLabel) return;
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
  }

  function startEditRow(index: number) {
    setEditingIndex(index);
    setDraft({ ...payloads[index] });
  }

  function cancelEditRow() {
    setEditingIndex(null);
    setDraft(null);
  }

  /** Keeps the table's draft and the canvas's draft in sync -- both write here. */
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      // Keep edit mode open so the user can retry.
    } finally {
      setRecalcIndex(null);
    }
  }

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto flex max-w-[100rem] flex-col gap-6 p-4 sm:p-6">
        <header className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              ERV Energy Savings Calculator
            </h1>
            <p className="text-sm text-slate-500">
              Configure BaseCase and up to 4 alternative ERV options, then compare energy, cost, and
              CO2 outcomes.
            </p>
          </div>
          <ScenarioStepper labels={SCENARIO_LABELS} currentIndex={currentIndex} />
        </header>

        <div
          className={cn(
            "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow sm:p-6",
            isEditingRow && "ring-2 ring-[#1E4FD8]/30",
          )}
        >
          <div className="mb-5 flex items-center gap-2">
            {isEditingRow ? (
              <>
                <Pencil className="size-5" style={{ color: BLUE }} />
                <h2 className="text-lg font-semibold text-slate-900">Editing: {payloads[editingIndex]?.scenario}</h2>
              </>
            ) : done ? (
              <>
                <PartyPopper className="size-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900">All scenarios complete</h2>
              </>
            ) : (
              <>
                <Sparkles className="size-5" style={{ color: BLUE }} />
                <h2 className="text-lg font-semibold text-slate-900">Configuring: {currentLabel}</h2>
              </>
            )}
          </div>

          {isEditingRow && draft ? (
            <ErvCanvas form={payloadToFormState(draft, form)} onChange={updateDraftFromForm} />
          ) : (
            <ErvCanvas form={form} onChange={setForm} disabled={loading || done} />
          )}

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            {isEditingRow ? (
              <>
                <Button
                  onClick={() => editingIndex !== null && recalculateEditingRow(editingIndex)}
                  disabled={recalcIndex !== null}
                  size="lg"
                  style={{ backgroundColor: BLUE }}
                  className="text-white hover:opacity-90"
                >
                  {recalcIndex !== null ? "Recalculating…" : "Recalculate"}
                </Button>
                <Button variant="outline" onClick={cancelEditRow} disabled={recalcIndex !== null}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {!done && (
                  <Button
                    onClick={runScenario}
                    disabled={!canSubmit || loading}
                    size="lg"
                    style={{ backgroundColor: BLUE }}
                    className="text-white hover:opacity-90"
                  >
                    {loading ? "Calculating…" : `Run ${currentLabel}`}
                  </Button>
                )}
                {payloads.length > 0 && (
                  <Button variant="outline" onClick={reset} disabled={loading}>
                    <RotateCcw className="size-4" />
                    Start Over
                  </Button>
                )}
                {!canSubmit && !done && <p className="text-sm text-slate-400">Select a city to continue.</p>}
              </>
            )}
          </div>
        </div>

        {scenarios.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Results</h2>
            <Tabs defaultValue="inputs">
              <TabsList>
                <TabsTrigger value="inputs">Inputs &amp; Energy</TabsTrigger>
                <TabsTrigger value="analysis" disabled={isEditingRow} className="gap-1.5">
                  {isEditingRow && <Lock className="size-3" />}
                  Analysis
                </TabsTrigger>
              </TabsList>
              {isEditingRow && (
                <p className="pt-2 text-xs text-slate-400">
                  Analysis is locked until this row is recalculated — savings and payback compare
                  against BaseCase and would otherwise be out of date.
                </p>
              )}
              <TabsContent value="inputs" className="pt-4">
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
              <TabsContent value="analysis" className="pt-4">
                <AnalysisTable analysis={analysis} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
