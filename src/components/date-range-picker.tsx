"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateRangePreset = "7d" | "30d" | "this_month" | "90d" | "all" | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function getDefaultDateRange(): DateRangeValue {
  const range = getPresetDateRange("all");
  return {
    preset: "all",
    startDate: range.startDate,
    endDate: range.endDate,
  };
}

export function getPresetDateRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];

  if (preset === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return { startDate: d.toISOString().split("T")[0], endDate };
  }
  if (preset === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return { startDate: d.toISOString().split("T")[0], endDate };
  }
  if (preset === "this_month") {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: d.toISOString().split("T")[0], endDate };
  }
  if (preset === "90d") {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return { startDate: d.toISOString().split("T")[0], endDate };
  }
  if (preset === "all") {
    return { startDate: "2020-01-01", endDate };
  }
  return { startDate: endDate, endDate };
}

export function isDateInRange(dateStr: string, startDateStr: string, endDateStr: string): boolean {
  if (!dateStr) return true;
  if (startDateStr === "2020-01-01") return true;
  const projectDate = new Date(dateStr).getTime();
  if (isNaN(projectDate)) return true;

  const start = new Date(`${startDateStr}T00:00:00`).getTime();
  const end = new Date(`${endDateStr}T23:59:59`).getTime();
  return projectDate >= start && projectDate <= end;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<DateRangeValue>(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync temp value when props change externally
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const PRESETS: { id: DateRangePreset; label: string }[] = [
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "Last 30 Days" },
    { id: "this_month", label: "This Month" },
    { id: "90d", label: "Last 90 Days" },
    { id: "all", label: "All Time" },
  ];

  function handleSelectPreset(preset: DateRangePreset) {
    if (preset === "all") {
      const next = { preset: "all" as DateRangePreset, startDate: "2020-01-01", endDate: new Date().toISOString().split("T")[0] };
      setTempValue(next);
      onChange(next);
      setIsOpen(false);
      return;
    }

    const dates = getPresetDateRange(preset);
    const next = { preset, startDate: dates.startDate, endDate: dates.endDate };
    setTempValue(next);
    onChange(next);
    setIsOpen(false);
  }

  function handleApplyCustom() {
    onChange(tempValue);
    setIsOpen(false);
  }

  function handleReset() {
    const defaultVal = getDefaultDateRange();
    setTempValue(defaultVal);
    onChange(defaultVal);
    setIsOpen(false);
  }

  const getDisplayLabel = () => {
    if (value.preset === "7d") return "Last 7 Days";
    if (value.preset === "30d") return "Last 30 Days";
    if (value.preset === "this_month") return "This Month";
    if (value.preset === "90d") return "Last 90 Days";
    if (value.preset === "all") return "All Time";
    return `${formatDateLabel(value.startDate)} - ${formatDateLabel(value.endDate)}`;
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition-all hover:border-[#1E4FD8] hover:bg-slate-50 cursor-pointer",
          isOpen && "border-[#1E4FD8] ring-2 ring-[#1E4FD8]/20"
        )}
      >
        <Calendar className="h-4 w-4 text-[#1E4FD8]" />
        <span>{getDisplayLabel()}</span>
        <span className="text-[0.65rem] font-semibold text-slate-400">
          ({formatDateLabel(value.startDate)} - {formatDateLabel(value.endDate)})
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs font-extrabold text-slate-900">Select Date Range</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const isActive = tempValue.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#1E4FD8] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-4">
            <label className="block text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider">
              Custom Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[0.65rem] font-semibold text-slate-500 mb-1">From Date</span>
                <input
                  type="date"
                  value={tempValue.startDate}
                  onChange={(e) =>
                    setTempValue({ ...tempValue, preset: "custom", startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-[#1E4FD8]"
                />
              </div>
              <div>
                <span className="block text-[0.65rem] font-semibold text-slate-500 mb-1">To Date</span>
                <input
                  type="date"
                  value={tempValue.endDate}
                  onChange={(e) =>
                    setTempValue({ ...tempValue, preset: "custom", endDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-[#1E4FD8]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button
              type="button"
              onClick={handleApplyCustom}
              className="rounded-lg bg-[#1E4FD8] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
