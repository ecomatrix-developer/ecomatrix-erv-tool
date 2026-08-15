"use client";

import { useState, useEffect } from "react";
import type { AnalysisRow, ScenarioOutputs } from "@/lib/calc-engine/types";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { NumberInput, type UnitType } from "@/components/stage-fields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Pencil, RefreshCw, MapPin, ChevronRight, ChevronDown, Minimize2, X } from "lucide-react";

const BLUE = "#1E4FD8";

function fmt(n: number | null, digits = 2): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtCurrency(n: number | null, digits = 0): string {
  if (n === null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}


function EditNumberCell({
  value,
  onChange,
  editing,
  step = "any",
  unitType,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  editing: boolean;
  step?: string;
  unitType?: UnitType;
  className?: string;
}) {
  if (!editing) {
    return <TableCell className={cn(ROW_HEIGHT, className)}>{value}</TableCell>;
  }
  return (
    <TableCell className={cn(ROW_HEIGHT, className)}>
      <NumberInput
        value={value}
        onChange={onChange}
        step={step}
        unitType={unitType}
        className="h-8 w-28 text-xs"
      />
    </TableCell>
  );
}

function EditPercentCell({
  value,
  onChange,
  editing,
}: {
  value: number;
  onChange: (v: number) => void;
  editing: boolean;
}) {
  const [textValue, setTextValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const pctVal = Math.round(value * 1000) / 10;

  useEffect(() => {
    if (!isEditing) {
      setTextValue(String(pctVal));
    }
  }, [pctVal, isEditing]);

  if (!editing) {
    return <TableCell className={ROW_HEIGHT}>{fmtPct(value)}</TableCell>;
  }

  const handleChange = (rawStr: string) => {
    let cleanedStr = rawStr;
    if (/^0+[1-9]/.test(rawStr)) {
      cleanedStr = rawStr.replace(/^0+/, "");
    }
    setTextValue(cleanedStr);

    if (cleanedStr === "" || cleanedStr === "-") {
      onChange(0);
      return;
    }
    const parsed = parseFloat(cleanedStr);
    if (!isNaN(parsed)) {
      onChange(parsed / 100);
    }
  };

  return (
    <TableCell className={ROW_HEIGHT}>
      <div className="relative">
        <Input
          type="number"
          step="any"
          value={isEditing ? textValue : pctVal}
          onFocus={(e) => {
            setIsEditing(true);
            e.target.select();
          }}
          onBlur={() => {
            setIsEditing(false);
            if (textValue === "" || isNaN(parseFloat(textValue))) {
              setTextValue(String(pctVal));
            }
          }}
          onChange={(e) => handleChange(e.target.value)}
          className="h-8 w-20 border-slate-200 pr-5 text-xs focus-visible:border-[#1E4FD8] focus-visible:ring-[#1E4FD8]/20"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[0.65rem] text-slate-400">
          %
        </span>
      </div>
    </TableCell>
  );
}

function EditTextCell({
  value,
  onChange,
  editing,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  className?: string;
}) {
  if (!editing) {
    return <TableCell className={cn(ROW_HEIGHT, "font-medium text-slate-900", className)}>{value || "—"}</TableCell>;
  }
  return (
    <TableCell className={cn(ROW_HEIGHT, className)}>
      <Input
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-32 border-slate-200 text-xs focus-visible:border-[#1E4FD8] focus-visible:ring-[#1E4FD8]/20"
      />
    </TableCell>
  );
}

function EditFuelSourceCell({
  value,
  onChange,
  editing,
}: {
  value: "Electricity" | "Natural Gas";
  onChange: (v: "Electricity" | "Natural Gas") => void;
  editing: boolean;
}) {
  if (!editing) {
    return <TableCell className={ROW_HEIGHT}>{value}</TableCell>;
  }
  return (
    <TableCell className={ROW_HEIGHT}>
      <Select value={value} onValueChange={(v) => onChange(v as "Electricity" | "Natural Gas")}>
        <SelectTrigger className="h-8 w-28 border-slate-200 text-xs data-[state=open]:border-[#1E4FD8]" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Electricity">Electricity</SelectItem>
          <SelectItem value="Natural Gas">Natural Gas</SelectItem>
        </SelectContent>
      </Select>
    </TableCell>
  );
}

export interface EditableInputsTableProps {
  payloads: ScenarioInputsPayload[];
  scenarios: ScenarioOutputs[];
  /** Row index currently being edited, or null. Owned by the parent so the same
   *  draft can also drive the <InputForm/> above the table. */
  editingIndex: number | null;
  draft: ScenarioInputsPayload | null;
  recalcIndex: number | null;
  onStartEdit?: (index: number) => void;
  onCancelEdit?: () => void;
  onDraftChange?: (draft: ScenarioInputsPayload) => void;
  onRecalculate?: (index: number) => void;
  readOnly?: boolean;
}

const STICKY_LEFT_HEAD = "sticky left-0 z-20 bg-slate-50 px-1.5 py-1 text-[11px]";
const STICKY_RIGHT_HEAD = "sticky right-0 z-20 bg-slate-50 min-w-[3.5rem] w-14 px-1 py-1 text-[11px]";
const STICKY_LEFT = "sticky left-0 z-20 px-1.5 py-0.5 text-[11px]";
const STICKY_RIGHT = "sticky right-0 z-20 min-w-[3.5rem] w-14 px-1 py-0.5 text-[11px]";
const HEAD_CLASS = "text-slate-600 font-semibold whitespace-nowrap align-bottom px-1.5 py-1 text-[11px]";
const ROW_HEIGHT = "h-7 text-slate-700 px-1.5 py-0.5 text-[11px]";
const NARROW = "w-16 max-w-16 px-1 py-0.5 text-[11px]";

/** Shows a short label by default; hovering reveals the full column name via the
 * browser's native tooltip (title attribute), which renders outside the table's
 * scroll/clip containers instead of a custom floating tooltip that would get cut
 * off by the sticky-column and horizontal-scroll overflow settings. */
function HeaderLabel({ short, full }: { short: string; full: string }) {
  return (
    <span title={full} className="cursor-default underline decoration-slate-300 decoration-dotted underline-offset-2">
      {short}
    </span>
  );
}

/**
 * A single horizontally-scrolling table covering input columns up to Fuel Cost.
 */
export function EditableInputsTable({
  payloads,
  scenarios,
  editingIndex,
  draft,
  recalcIndex,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onRecalculate,
  readOnly = false,
}: EditableInputsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    eff: false,
    flows: false,
    cops: false,
    sources: false,
    ghg: false,
    fuel: false,
  });

  const collapseAll = () => {
    setExpandedGroups({
      eff: false,
      flows: false,
      cops: false,
      sources: false,
      ghg: false,
      fuel: false,
    });
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    collapseAll();
  }, [editingIndex]);

  function setDraftField<K extends keyof ScenarioInputsPayload>(key: K, value: ScenarioInputsPayload[K]) {
    if (draft && onDraftChange) onDraftChange({ ...draft, [key]: value });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 transition-all duration-300">
      <Table>
        <TableHeader className="bg-slate-50 border-b border-slate-200">
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead className={cn(HEAD_CLASS, STICKY_LEFT_HEAD)}>Model</TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Location" full="Location (City / Weather)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Tech" full="Tech Name" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Preheat" full="Preheat (°C)" /></TableHead>

            {!expandedGroups.eff ? (
              <TableHead className={HEAD_CLASS}>
                <button
                  type="button"
                  onClick={() => toggleGroup("eff")}
                  className="inline-flex items-center gap-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                  title="Click to expand ERV Effectiveness sub-columns"
                >
                  <span>Eff.</span>
                  <ChevronRight className="size-3 text-slate-400" />
                </button>
              </TableHead>
            ) : (
              <>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("eff")}
                  title="Click to collapse Eff. group"
                >
                  <div className="flex items-center gap-0.5">
                    <HeaderLabel short="W.Sens" full="Winter Sensible EFF" />
                    <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("eff")}
                  title="Click to collapse Eff. group"
                >
                  <HeaderLabel short="S.Sens" full="Summer Sensible EFF" />
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("eff")}
                  title="Click to collapse Eff. group"
                >
                  <HeaderLabel short="W.Lat" full="Winter Latent EFF" />
                </TableHead>
              </>
            )}

            {!expandedGroups.flows ? (
              <TableHead className={HEAD_CLASS}>
                <button
                  type="button"
                  onClick={() => toggleGroup("flows")}
                  className="inline-flex items-center gap-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                  title="Click to expand Air Flow sub-columns"
                >
                  <span>Flows</span>
                  <ChevronRight className="size-3 text-slate-400" />
                </button>
              </TableHead>
            ) : (
              <>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("flows")}
                  title="Click to collapse Flows group"
                >
                  <div className="flex items-center gap-0.5">
                    <HeaderLabel short="Supply" full="Supply Air Flow (L/s)" />
                    <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("flows")}
                  title="Click to collapse Flows group"
                >
                  <HeaderLabel short="Exhaust" full="Exhaust Air Flow (L/s)" />
                </TableHead>
              </>
            )}

            {!expandedGroups.cops ? (
              <TableHead className={HEAD_CLASS}>
                <button
                  type="button"
                  onClick={() => toggleGroup("cops")}
                  className="inline-flex items-center gap-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                  title="Click to expand COP sub-columns"
                >
                  <span>COPs</span>
                  <ChevronRight className="size-3 text-slate-400" />
                </button>
              </TableHead>
            ) : (
              <>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("cops")}
                  title="Click to collapse COPs group"
                >
                  <div className="flex items-center gap-0.5">
                    <HeaderLabel short="Pre.COP" full="Pre-heat (COP)" />
                    <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("cops")}
                  title="Click to collapse COPs group"
                >
                  <HeaderLabel short="Post.COP" full="Post-heat (COP)" />
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("cops")}
                  title="Click to collapse COPs group"
                >
                  <HeaderLabel short="Cool.COP" full="Cooling (COP)" />
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("cops")}
                  title="Click to collapse COPs group"
                >
                  <HeaderLabel short="Hum.COP" full="Humidification (COP)" />
                </TableHead>
              </>
            )}

            {!expandedGroups.sources ? (
              <TableHead className={HEAD_CLASS}>
                <button
                  type="button"
                  onClick={() => toggleGroup("sources")}
                  className="inline-flex items-center gap-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                  title="Click to expand Fuel Source sub-columns"
                >
                  <span>Sources</span>
                  <ChevronRight className="size-3 text-slate-400" />
                </button>
              </TableHead>
            ) : (
              <>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("sources")}
                  title="Click to collapse Sources group"
                >
                  <div className="flex items-center gap-0.5">
                    <HeaderLabel short="Pre.Src" full="Preheat Source" />
                    <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("sources")}
                  title="Click to collapse Sources group"
                >
                  <HeaderLabel short="Post.Src" full="Post Heat Source" />
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("sources")}
                  title="Click to collapse Sources group"
                >
                  <HeaderLabel short="Hum.Src" full="Humidification Source" />
                </TableHead>
              </>
            )}

            {!expandedGroups.ghg ? (
              <TableHead className={cn(HEAD_CLASS, "border-l border-slate-200 bg-slate-50")}>
                <button
                  type="button"
                  onClick={() => toggleGroup("ghg")}
                  className="inline-flex items-center gap-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                  title="Click to expand GHG Factor sub-columns"
                >
                  <span>GHG</span>
                  <ChevronRight className="size-3 text-slate-400" />
                </button>
              </TableHead>
            ) : (
              <>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "border-l border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("ghg")}
                  title="Click to collapse GHG group"
                >
                  <div className="flex items-center gap-0.5">
                    <HeaderLabel short="GHG Elec." full="GHG Electricity (kgCO2/kWh)" />
                    <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "bg-slate-50 cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("ghg")}
                  title="Click to collapse GHG group"
                >
                  <HeaderLabel short="GHG Gas" full="GHG Natural Gas (kgCO2/kWh)" />
                </TableHead>
              </>
            )}

            {!expandedGroups.fuel ? (
              <TableHead className={cn(HEAD_CLASS, "border-r border-slate-200 bg-slate-50")}>
                <button
                  type="button"
                  onClick={() => toggleGroup("fuel")}
                  className="inline-flex items-center gap-0.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer border border-slate-200"
                  title="Click to expand Fuel Cost sub-columns"
                >
                  <span>Fuel Cost</span>
                  <ChevronRight className="size-3 text-slate-400" />
                </button>
              </TableHead>
            ) : (
              <>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "bg-slate-50 cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("fuel")}
                  title="Click to collapse Fuel Cost group"
                >
                  <div className="flex items-center gap-0.5">
                    <HeaderLabel short="Fuel Elec." full="Fuel Cost Electricity ($/kWh)" />
                    <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
                  </div>
                </TableHead>
                <TableHead
                  className={cn(HEAD_CLASS, NARROW, "border-r border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-200/70 transition-colors")}
                  onClick={() => toggleGroup("fuel")}
                  title="Click to collapse Fuel Cost group"
                >
                  <HeaderLabel short="Fuel Gas" full="Fuel Cost Natural Gas ($/kWh)" />
                </TableHead>
              </>
            )}

            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Preheat E." full="Pre-heating Energy (MWh)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Postheat E." full="Post Heating Energy (MWh)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Cooling E." full="Cooling Energy (MWh)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Humid. E." full="Humidification Energy (MWh)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Total E." full="Total Energy (MWh)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Op. Cost" full="Total Operational Cost ($)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Cap. Cost" full="Capital Cost ($)" />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, NARROW)}>
              <HeaderLabel short="Total GHG" full="Total GHG Factor (Tons)" />
            </TableHead>
            {!readOnly && (
              <TableHead className={cn(HEAD_CLASS, "border-l border-slate-200 text-center", STICKY_RIGHT_HEAD)}>Action</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payloads.map((p, i) => {
            const editing = editingIndex === i;
            const recalculating = recalcIndex === i;
            const anyOtherEditing = editingIndex !== null && editingIndex !== i;
            const row = editing && draft ? draft : p;
            const s = scenarios[i];
            const set = <K extends keyof ScenarioInputsPayload>(key: K, value: ScenarioInputsPayload[K]) =>
              setDraftField(key, value);
            const stickyTint = editing ? "bg-slate-50" : "bg-white";
            return (
              <TableRow key={p.scenario} className={cn("border-slate-200", editing && "bg-slate-50/80")}>
                <TableCell className={cn(ROW_HEIGHT, STICKY_LEFT, stickyTint, "font-bold text-slate-900")}>
                  {p.scenario}
                </TableCell>
                <EditTextCell value={row.city} onChange={(v) => set("city", v)} editing={editing} />
                <EditTextCell value={row.ervTech} onChange={(v) => set("ervTech", v)} editing={editing} />
                <EditNumberCell value={row.preheatTemp} onChange={(v) => set("preheatTemp", v)} unitType="temperature" editing={editing} />
                
                {!expandedGroups.eff ? (
                  <TableCell
                    className={cn(ROW_HEIGHT, "text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-help px-1.5")}
                    title={`Winter Sens: ${fmtPct(row.winterSensibleEff)}, Summer Sens: ${fmtPct(row.summerSensibleEff)}, Winter Latent: ${fmtPct(row.winterLatentEff)}`}
                  >
                    {fmtPct(row.winterSensibleEff)}
                  </TableCell>
                ) : (
                  <>
                    <EditPercentCell
                      value={row.winterSensibleEff}
                      onChange={(v) => set("winterSensibleEff", v)}
                      editing={editing}
                    />
                    <EditPercentCell
                      value={row.summerSensibleEff}
                      onChange={(v) => set("summerSensibleEff", v)}
                      editing={editing}
                    />
                    <EditPercentCell
                      value={row.winterLatentEff}
                      onChange={(v) => set("winterLatentEff", v)}
                      editing={editing}
                    />
                  </>
                )}

                {!expandedGroups.flows ? (
                  <TableCell
                    className={cn(ROW_HEIGHT, "text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-help px-1.5")}
                    title={`Supply Air Flow: ${row.supplyFlow} L/s, Exhaust Air Flow: ${row.exhaustFlow} L/s`}
                  >
                    {row.supplyFlow} L/s
                  </TableCell>
                ) : (
                  <>
                    <EditNumberCell value={row.supplyFlow} onChange={(v) => set("supplyFlow", v)} unitType="flow" editing={editing} />
                    <EditNumberCell value={row.exhaustFlow} onChange={(v) => set("exhaustFlow", v)} unitType="flow" editing={editing} />
                  </>
                )}

                {!expandedGroups.cops ? (
                  <TableCell
                    className={cn(ROW_HEIGHT, "text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-help px-1.5")}
                    title={`Preheat COP: ${row.copPreheat}, Postheat COP: ${row.copPostheat}, Cooling COP: ${row.copCooling}, Humid COP: ${row.copHumidification}`}
                  >
                    {row.copPreheat}
                  </TableCell>
                ) : (
                  <>
                    <EditNumberCell value={row.copPreheat} onChange={(v) => set("copPreheat", v)} editing={editing} />
                    <EditNumberCell value={row.copPostheat} onChange={(v) => set("copPostheat", v)} editing={editing} />
                    <EditNumberCell value={row.copCooling} onChange={(v) => set("copCooling", v)} editing={editing} />
                    <EditNumberCell
                      value={row.copHumidification}
                      onChange={(v) => set("copHumidification", v)}
                      editing={editing}
                    />
                  </>
                )}

                {!expandedGroups.sources ? (
                  <TableCell
                    className={cn(ROW_HEIGHT, "text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-help px-1.5")}
                    title={`Preheat Source: ${row.preheatFuelSource}, Postheat Source: ${row.postheatFuelSource}, Humid Source: ${row.humidificationFuelSource}`}
                  >
                    {row.preheatFuelSource.slice(0, 3)}
                  </TableCell>
                ) : (
                  <>
                    <EditFuelSourceCell
                      value={row.preheatFuelSource}
                      onChange={(v) => set("preheatFuelSource", v)}
                      editing={editing}
                    />
                    <EditFuelSourceCell
                      value={row.postheatFuelSource}
                      onChange={(v) => set("postheatFuelSource", v)}
                      editing={editing}
                    />
                    <EditFuelSourceCell
                      value={row.humidificationFuelSource}
                      onChange={(v) => set("humidificationFuelSource", v)}
                      editing={editing}
                    />
                  </>
                )}

                {!expandedGroups.ghg ? (
                  <TableCell
                    className={cn(ROW_HEIGHT, "border-l border-slate-200 bg-slate-50/40 text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-help px-1.5")}
                    title={`GHG Electricity: ${row.ghgElectricity} kgCO2/kWh, GHG Natural Gas: ${row.ghgNaturalGas} kgCO2/kWh`}
                  >
                    {row.ghgElectricity}
                  </TableCell>
                ) : (
                  <>
                    <EditNumberCell
                      value={row.ghgElectricity}
                      onChange={(v) => set("ghgElectricity", v)}
                      editing={editing}
                    />
                    <EditNumberCell
                      value={row.ghgNaturalGas}
                      onChange={(v) => set("ghgNaturalGas", v)}
                      editing={editing}
                    />
                  </>
                )}

                {!expandedGroups.fuel ? (
                  <TableCell
                    className={cn(ROW_HEIGHT, "border-r border-slate-200 bg-slate-50/40 text-[11px] font-medium text-slate-700 whitespace-nowrap cursor-help px-1.5")}
                    title={`Fuel Cost Elec: $${row.fuelCostElectricity}/kWh, Fuel Cost Gas: $${row.fuelCostNaturalGas}/kWh`}
                  >
                    ${row.fuelCostElectricity}
                  </TableCell>
                ) : (
                  <>
                    <EditNumberCell
                      value={row.fuelCostElectricity}
                      onChange={(v) => set("fuelCostElectricity", v)}
                      editing={editing}
                    />
                    <EditNumberCell
                      value={row.fuelCostNaturalGas}
                      onChange={(v) => set("fuelCostNaturalGas", v)}
                      editing={editing}
                      className="border-r border-slate-200"
                    />
                  </>
                )}
                
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmt(s.preheatEnergyMwh)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmt(s.postHeatingEnergyMwh)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmt(s.coolingEnergyMwh)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmt(s.humidificationEnergyMwh)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmt(s.totalEnergyMwh)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmtCurrency(s.totalOperationalCost)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmtCurrency(s.capitalCost)}</TableCell>
                <TableCell className={cn(ROW_HEIGHT, NARROW)}>{fmt(s.totalGhgTons)}</TableCell>
                {!readOnly && (
                  <TableCell className={cn(ROW_HEIGHT, "border-l border-slate-200 text-center px-1", STICKY_RIGHT, stickyTint)}>
                    {editing ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          disabled={recalculating}
                          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                          title="Cancel edit"
                        >
                          <X className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRecalculate?.(i)}
                          disabled={recalculating}
                          className="inline-flex items-center gap-0.5 rounded bg-[#1E4FD8] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs hover:bg-blue-700 cursor-pointer"
                          title="Save changes"
                        >
                          {recalculating ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => onStartEdit?.(i)}
                          disabled={anyOtherEditing}
                          className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                        >
                          <Pencil className="size-2.5 text-slate-400" /> Edit
                        </button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function AnalysisTable({ analysis }: { analysis: AnalysisRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead className={HEAD_CLASS}>Scenario</TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Total E. (MWh)" full="Total Energy (MWh)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="E. Savings" full="Energy Savings (%)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="CO2 (Tons)" full="Total CO2 (Tons)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="CO2 Red." full="CO2 Reduction (%)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Cap. Cost ($)" full="Capital Cost ($)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Cap. Premium" full="Capital Cost Premium ($)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Op. Cost ($)" full="Total Operational Cost ($)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Op. Saving ($)" full="Operational Cost Saving ($)" /></TableHead>
            <TableHead className={HEAD_CLASS}><HeaderLabel short="Payback (Yrs)" full="Simple Payback (Years)" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysis.map((row) => (
            <TableRow key={row.scenario} className="border-slate-200 text-slate-700">
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] font-bold text-slate-900">{row.scenario}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{fmt(row.totalOaEnergyMwh)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{fmtPct(row.energySavingsPct)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{fmt(row.totalCo2Tons)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{fmtPct(row.co2ReductionPct)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{fmtCurrency(row.capitalCost)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{row.capitalCostPremium === null ? "—" : fmtCurrency(row.capitalCostPremium)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{fmtCurrency(row.totalOperationalCost)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{row.operationalCostSaving === null ? "—" : fmtCurrency(row.operationalCostSaving)}</TableCell>
              <TableCell className="h-7 px-1.5 py-0.5 text-[11px] whitespace-nowrap">{row.simplePaybackYears === null ? "—" : fmt(row.simplePaybackYears)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
