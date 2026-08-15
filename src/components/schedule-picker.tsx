"use client";

import { useState, useRef, useEffect } from "react";
import { DAYS_OF_WEEK, HOURS_OF_DAY, MONTHS_OF_YEAR } from "@/lib/calc-engine/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleGroupProps {
  title: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  compact?: boolean;
  disabled?: boolean;
}

function ScheduleGroup({ title, options, selected, onChange, compact, disabled }: ScheduleGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const allSelected = selected.length === options.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expanded]);

  function toggleOption(option: string, checked: boolean) {
    if (disabled) return;
    onChange(checked ? [...selected, option] : selected.filter((o) => o !== option));
  }

  function toggleAll() {
    if (disabled) return;
    onChange(allSelected ? [] : [...options]);
  }

  return (
    <div ref={ref} className={cn("relative", expanded && !disabled && "z-40")}>
      <div className={cn("flex items-center justify-between gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 transition-colors hover:border-slate-400", compact ? "text-xs" : "text-sm", disabled && "bg-slate-100 opacity-70 border-slate-200")}>
        <button
          type="button"
          disabled={disabled}
          className={cn("flex items-center gap-1 font-semibold text-slate-800 text-left flex-1 cursor-pointer", disabled && "cursor-not-allowed text-slate-500")}
          onClick={() => !disabled && setExpanded((e) => !e)}
        >
          <span>{title}</span>
          <span className="font-normal text-slate-500 text-[10px]">
            ({selected.length}/{options.length})
          </span>
          {expanded && !disabled ? <ChevronUp className="size-3 text-slate-500 ml-auto" /> : <ChevronDown className="size-3 text-slate-500 ml-auto" />}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={toggleAll}
          className="h-5 px-1.5 text-[0.65rem] font-bold text-[#1E4FD8] hover:bg-blue-50 cursor-pointer ml-1 disabled:opacity-50"
        >
          {allSelected ? "Clear" : "All"}
        </Button>
      </div>

      {!disabled && expanded && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in-50 zoom-in-95 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <span className="text-[11px] font-bold text-slate-700">{title} Selection</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4")}>
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 cursor-pointer select-none"
              >
                <Checkbox
                  checked={selected.includes(option)}
                  onCheckedChange={(checked) => toggleOption(option, checked === true)}
                  className="size-3.5"
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SchedulePickerProps {
  hours: string[];
  days: string[];
  months: string[];
  onChange: (next: { hours: string[]; days: string[]; months: string[] }) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function SchedulePicker({ hours, days, months, onChange, compact, disabled }: SchedulePickerProps) {
  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      <ScheduleGroup
        title="Hours of Day"
        options={HOURS_OF_DAY}
        selected={hours}
        onChange={(next) => onChange({ hours: next, days, months })}
        compact={compact}
        disabled={disabled}
      />
      <ScheduleGroup
        title="Days of Week"
        options={DAYS_OF_WEEK}
        selected={days}
        onChange={(next) => onChange({ hours, days: next, months })}
        compact={compact}
        disabled={disabled}
      />
      <ScheduleGroup
        title="Months of Year"
        options={MONTHS_OF_YEAR}
        selected={months}
        onChange={(next) => onChange({ hours, days, months: next })}
        compact={compact}
        disabled={disabled}
      />
    </div>
  );
}
