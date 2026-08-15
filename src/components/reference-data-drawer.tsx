"use client";

import type { FormState } from "@/lib/form-defaults";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Field, NumberInput } from "@/components/stage-fields";
import { Thermometer, Droplets, Coins, Leaf } from "lucide-react";

interface ReferenceDataDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  onChange: (next: FormState) => void;
}

function Section({ icon: Icon, title, children }: { icon: typeof Thermometer; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 px-6 py-5 last:border-b-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-[#1E4FD8]" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

/**
 * Rarely-changed reference values (effectiveness curves, fuel cost, GHG factors)
 * live off the main canvas in a slide-out drawer, keeping the flow diagram and
 * stage inspector focused on the decisions that vary scenario to scenario.
 */
export function ReferenceDataDrawer({ open, onOpenChange, form, onChange }: ReferenceDataDrawerProps) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => onChange({ ...form, [key]: value });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reference Data</SheetTitle>
          <SheetDescription>Effectiveness curves, fuel cost, and GHG factors used across every stage.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Section icon={Thermometer} title="Sensible Effectiveness">
            <Field label="Winter (%)">
              <NumberInput value={form.winterSensibleEff} onChange={(v) => set("winterSensibleEff", v)} />
            </Field>
            <Field label="Summer (%)">
              <NumberInput value={form.summerSensibleEff} onChange={(v) => set("summerSensibleEff", v)} />
            </Field>
          </Section>

          <Section icon={Droplets} title="Latent Effectiveness">
            <Field label="Winter (%)">
              <NumberInput value={form.winterLatentEff} onChange={(v) => set("winterLatentEff", v)} />
            </Field>
            <Field label="Summer (%)">
              <NumberInput value={form.summerLatentEff} onChange={(v) => set("summerLatentEff", v)} />
            </Field>
          </Section>

          <Section icon={Coins} title="Fuel Cost">
            <Field label="Electricity ($/kWh)">
              <NumberInput value={form.fuelCostElectricity} onChange={(v) => set("fuelCostElectricity", v)} />
            </Field>
            <Field label="Natural Gas ($/kWh)">
              <NumberInput value={form.fuelCostNaturalGas} onChange={(v) => set("fuelCostNaturalGas", v)} />
            </Field>
          </Section>

          <Section icon={Leaf} title="GHG Factors">
            <Field label="Electricity (kg/kWh)">
              <NumberInput value={form.ghgElectricity} onChange={(v) => set("ghgElectricity", v)} />
            </Field>
            <Field label="Natural Gas (kg/kWh)">
              <NumberInput value={form.ghgNaturalGas} onChange={(v) => set("ghgNaturalGas", v)} />
            </Field>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
