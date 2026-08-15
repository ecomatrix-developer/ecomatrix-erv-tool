"use client";

import { useState } from "react";
import type { FormState } from "@/lib/form-defaults";
import { LocationPicker } from "@/components/location-picker";
import { SchedulePicker } from "@/components/schedule-picker";
import { FlowCanvas, FLOW_NODES, type FlowNodeId } from "@/components/flow-canvas";
import { Field, TextInput, NumberInput, ToggleField, FuelSourceSelect } from "@/components/stage-fields";
import { ReferenceDataDrawer } from "@/components/reference-data-drawer";
import { MapPin, Wind, CalendarClock, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const BLUE = "#1E4FD8";

interface ErvCanvasProps {
  form: FormState;
  onChange: (next: FormState) => void;
  disabled?: boolean;
}

function isNodeComplete(node: FlowNodeId, form: FormState): boolean {
  switch (node) {
    case "preheat":
      return form.preheatFlag === "NO" || form.preheatTemp !== 0;
    case "erv":
      return form.ervTech.trim() !== "";
    case "heating":
      return true;
    case "cooling":
      return true;
    case "humidification":
      return form.humidificationFlag === "NO" || form.rhSetpoint > 0;
    default:
      return false;
  }
}

function PinnedCard({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StageCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ErvCanvas({ form, onChange, disabled }: ErvCanvasProps) {
  const [activeNode, setActiveNode] = useState<FlowNodeId>("preheat");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => onChange({ ...form, [key]: value });

  const completedNodes = new Set(FLOW_NODES.map((n) => n.id).filter((id) => isNodeComplete(id, form)));
  const preheatOff = form.preheatFlag === "NO";
  const humidificationOff = form.humidificationFlag === "NO";

  return (
    <fieldset disabled={disabled} className="contents">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)]">
        {/* Left: flow canvas, sticky */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Process Flow</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#1E4FD8]/40 hover:text-[#1E4FD8]"
            >
              <SlidersHorizontal className="size-3.5" />
              Reference Data
            </button>
          </div>
          <FlowCanvas activeNode={activeNode} completedNodes={completedNodes} onSelectNode={setActiveNode} />

          <div className="mt-4 flex flex-wrap gap-1.5">
            {FLOW_NODES.map((node) => {
              const done = completedNodes.has(node.id);
              const active = activeNode === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveNode(node.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active && "border-transparent text-white",
                    !active && done && "border-[#1E4FD8]/30 bg-[#1E4FD8]/5 text-[#1E4FD8]",
                    !active && !done && "border-slate-200 text-slate-400",
                  )}
                  style={active ? { backgroundColor: BLUE } : undefined}
                >
                  {node.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: pinned global cards + active stage inspector */}
        <div className="space-y-4">
          <PinnedCard icon={MapPin} title="Location">
            <LocationPicker
              region={form.region}
              country={form.country}
              province={form.province}
              city={form.city}
              customWeather={form.customWeather}
              onChange={(next) => onChange({ ...form, ...next })}
            />
          </PinnedCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <PinnedCard icon={Wind} title="Air Flow">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Supply Flow (L/s / CFM)">
                  <NumberInput value={form.supplyFlow} onChange={(v) => set("supplyFlow", v)} unitType="flow" />
                </Field>
                <Field label="Exhaust Flow (L/s / CFM)">
                  <NumberInput value={form.exhaustFlow} onChange={(v) => set("exhaustFlow", v)} unitType="flow" />
                </Field>
              </div>
              {form.exhaustFlow > form.supplyFlow && (
                <p className="mt-2 text-xs text-red-500">Exhaust should not exceed supply.</p>
              )}
            </PinnedCard>

            <PinnedCard icon={CalendarClock} title="Operating Schedule">
              <SchedulePicker
                hours={form.hours}
                days={form.days}
                months={form.months}
                onChange={(next) => onChange({ ...form, ...next })}
                compact
              />
            </PinnedCard>
          </div>

          {activeNode === "preheat" && (
            <StageCard title="Preheat System" description="Pre-conditions outdoor air before it reaches the ERV core.">
              <ToggleField label="Enable Preheat" checked={!preheatOff} onChange={(v) => set("preheatFlag", v ? "YES" : "NO")} />
              <Field label="Fuel Source">
                <FuelSourceSelect value={form.preheatFuelSource} onChange={(v) => set("preheatFuelSource", v)} disabled={preheatOff} />
              </Field>
              <Field label="Setpoint (°C / °F)">
                <NumberInput value={form.preheatTemp} onChange={(v) => set("preheatTemp", v)} unitType="temperature" disabled={preheatOff} />
              </Field>
              <Field label="COP">
                <NumberInput value={form.copPreheat} onChange={(v) => set("copPreheat", v)} disabled={preheatOff} />
              </Field>
              <Field label="Capital Cost ($)">
                <NumberInput value={form.preheatCost} onChange={(v) => set("preheatCost", v)} disabled={preheatOff} />
              </Field>
            </StageCard>
          )}

          {activeNode === "erv" && (
            <StageCard title="ERV Technology" description="The core energy recovery ventilator unit.">
              <Field label="Technology Name">
                <TextInput value={form.ervTech} onChange={(v) => set("ervTech", v)} placeholder="e.g. Enthalpy Wheel" />
              </Field>
              <Field label="Capital Cost ($)">
                <NumberInput value={form.ervTechCost} onChange={(v) => set("ervTechCost", v)} />
              </Field>
              <p className="col-span-full text-xs text-slate-400">
                Sensible and latent effectiveness are configured in the Reference Data panel.
              </p>
            </StageCard>
          )}

          {activeNode === "heating" && (
            <StageCard title="Post ERV Heating" description="Additional heating applied after the ERV core.">
              <Field label="Setpoint (°C / °F)">
                <NumberInput value={form.postHeatSetpoint} onChange={(v) => set("postHeatSetpoint", v)} unitType="temperature" />
              </Field>
              <Field label="COP">
                <NumberInput value={form.copPostheat} onChange={(v) => set("copPostheat", v)} />
              </Field>
              <Field label="Fuel Source">
                <FuelSourceSelect value={form.postheatFuelSource} onChange={(v) => set("postheatFuelSource", v)} />
              </Field>
              <Field label="Capital Cost ($)">
                <NumberInput value={form.postErvHeatingCost} onChange={(v) => set("postErvHeatingCost", v)} />
              </Field>
            </StageCard>
          )}

          {activeNode === "cooling" && (
            <StageCard title="Post ERV Cooling" description="Additional cooling applied after the ERV core.">
              <Field label="Setpoint (°C / °F)">
                <NumberInput value={form.postCoolSetpoint} onChange={(v) => set("postCoolSetpoint", v)} unitType="temperature" />
              </Field>
              <Field label="COP">
                <NumberInput value={form.copCooling} onChange={(v) => set("copCooling", v)} />
              </Field>
              <Field label="Capital Cost ($)">
                <NumberInput value={form.postErvCoolingCost} onChange={(v) => set("postErvCoolingCost", v)} />
              </Field>
            </StageCard>
          )}

          {activeNode === "humidification" && (
            <StageCard title="Humidification" description="Optional supply-air humidity control.">
              <ToggleField
                label="Enable Humidification"
                checked={!humidificationOff}
                onChange={(v) => set("humidificationFlag", v ? "YES" : "NO")}
              />
              <Field label="Fuel Source">
                <FuelSourceSelect
                  value={form.humidificationFuelSource}
                  onChange={(v) => set("humidificationFuelSource", v)}
                  disabled={humidificationOff}
                />
              </Field>
              <Field label="RH Setpoint (%)">
                <NumberInput value={form.rhSetpoint} onChange={(v) => set("rhSetpoint", v)} disabled={humidificationOff} />
              </Field>
              <Field label="COP">
                <NumberInput value={form.copHumidification} onChange={(v) => set("copHumidification", v)} disabled={humidificationOff} />
              </Field>
              <Field label="Capital Cost ($)">
                <NumberInput value={form.humidificationCost} onChange={(v) => set("humidificationCost", v)} disabled={humidificationOff} />
              </Field>
            </StageCard>
          )}
        </div>
      </div>

      <ReferenceDataDrawer open={drawerOpen} onOpenChange={setDrawerOpen} form={form} onChange={onChange} />
    </fieldset>
  );
}
