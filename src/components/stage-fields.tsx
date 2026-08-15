"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const BLUE = "#1E4FD8";

export function Field({
  label,
  children,
  hint,
  dim,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  dim?: boolean;
}) {
  return (
    <label className={cn("block space-y-0.5 transition-opacity duration-300", dim && "pointer-events-none opacity-35")}>
      <span className="block text-[11px] font-semibold text-slate-600 leading-tight">{label}</span>
      {children}
      {hint && <span className="block text-[0.6rem] text-slate-400 leading-tight">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900 outline-none transition-colors",
        "placeholder:font-normal placeholder:text-slate-400 focus:border-[#1E4FD8] focus:ring-1 focus:ring-[#1E4FD8]/20",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
      )}
    />
  );
}

export type UnitType = "temperature" | "flow";

export function NumberInput({
  value,
  onChange,
  disabled,
  suffix,
  step = "any",
  unitType,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  suffix?: string;
  step?: string;
  unitType?: UnitType;
  className?: string;
}) {
  const primaryUnit = unitType === "temperature" ? "°C" : unitType === "flow" ? "L/s" : "";
  const secondaryUnit = unitType === "temperature" ? "°F" : unitType === "flow" ? "CFM" : "";

  const [activeUnit, setActiveUnit] = useState<string>(primaryUnit);
  const [textValue, setTextValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Synchronize displayed text whenever value changes externally or active unit toggles
  useEffect(() => {
    if (!isEditing) {
      if (unitType === "temperature" && activeUnit === "°F") {
        const valF = (value * 9) / 5 + 32;
        setTextValue(String(Math.round(valF * 100) / 100));
      } else if (unitType === "flow" && activeUnit === "CFM") {
        const valCFM = value * 2.11888;
        setTextValue(String(Math.round(valCFM * 100) / 100));
      } else {
        setTextValue(String(value ?? 0));
      }
    }
  }, [value, activeUnit, unitType, isEditing]);

  const handleUnitToggle = (newUnit: string) => {
    if (newUnit === activeUnit || disabled) return;
    setActiveUnit(newUnit);

    if (unitType === "temperature") {
      if (newUnit === "°F") {
        const valF = (value * 9) / 5 + 32;
        setTextValue(String(Math.round(valF * 100) / 100));
      } else {
        setTextValue(String(Math.round(value * 100) / 100));
      }
    } else if (unitType === "flow") {
      if (newUnit === "CFM") {
        const valCFM = value * 2.11888;
        setTextValue(String(Math.round(valCFM * 100) / 100));
      } else {
        setTextValue(String(Math.round(value * 100) / 100));
      }
    }
  };

  const handleInputChange = (rawStr: string) => {
    // Strip leading zeros e.g. "0120" -> "120" (allowing decimals like "0.5")
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
    if (isNaN(parsed)) return;

    let siVal = parsed;
    if (unitType === "temperature" && activeUnit === "°F") {
      siVal = ((parsed - 32) * 5) / 9;
      siVal = Math.round(siVal * 100) / 100;
    } else if (unitType === "flow" && activeUnit === "CFM") {
      siVal = parsed / 2.11888;
      siVal = Math.round(siVal * 100) / 100;
    }

    onChange(siVal);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textValue === "" || isNaN(parseFloat(textValue))) {
      if (unitType === "temperature" && activeUnit === "°F") {
        const valF = (value * 9) / 5 + 32;
        setTextValue(String(Math.round(valF * 100) / 100));
      } else if (unitType === "flow" && activeUnit === "CFM") {
        const valCFM = value * 2.11888;
        setTextValue(String(Math.round(valCFM * 100) / 100));
      } else {
        setTextValue(String(value ?? 0));
      }
    }
  };

  const displayVal = isEditing
    ? textValue
    : unitType === "temperature" && activeUnit === "°F"
    ? Math.round(((value * 9) / 5 + 32) * 100) / 100
    : unitType === "flow" && activeUnit === "CFM"
    ? Math.round(value * 2.11888 * 100) / 100
    : value;

  return (
    <div className="relative flex items-center">
      <input
        type="number"
        step={step}
        value={displayVal}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => handleInputChange(e.target.value)}
        className={cn(
          "h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-900 outline-none transition-colors",
          unitType ? "pr-16" : suffix ? "pr-6" : "",
          "focus:border-[#1E4FD8] focus:ring-1 focus:ring-[#1E4FD8]/20",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          className
        )}
      />
      {unitType ? (
        <div className="absolute right-0.5 flex items-center rounded bg-slate-100 p-0.5 text-[0.6rem] font-bold text-slate-600">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleUnitToggle(primaryUnit)}
            className={cn(
              "rounded px-1.5 py-0.5 transition-colors cursor-pointer",
              activeUnit === primaryUnit
                ? "bg-[#1E4FD8] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {primaryUnit}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleUnitToggle(secondaryUnit)}
            className={cn(
              "rounded px-1.5 py-0.5 transition-colors cursor-pointer",
              activeUnit === secondaryUnit
                ? "bg-[#1E4FD8] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {secondaryUnit}
          </button>
        </div>
      ) : suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] font-medium text-slate-400">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        style={checked ? ({ backgroundColor: BLUE } as React.CSSProperties) : undefined}
      />
    </div>
  );
}

export function FuelSourceSelect({
  value,
  onChange,
  disabled,
}: {
  value: "Electricity" | "Natural Gas";
  onChange: (v: "Electricity" | "Natural Gas") => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "Electricity" | "Natural Gas")} disabled={disabled}>
      <SelectTrigger className="h-7 w-full rounded-md border-slate-300 px-2 text-xs font-medium data-[state=open]:border-[#1E4FD8]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Electricity">Electricity</SelectItem>
        <SelectItem value="Natural Gas">Natural Gas</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function YesNoSelect({
  value,
  onChange,
  disabled,
}: {
  value: "YES" | "NO";
  onChange: (v: "YES" | "NO") => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "YES" | "NO")} disabled={disabled}>
      <SelectTrigger className="h-7 w-full rounded-md border-slate-300 px-2 text-xs font-medium data-[state=open]:border-[#1E4FD8]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="YES">YES</SelectItem>
        <SelectItem value="NO">NO</SelectItem>
      </SelectContent>
    </Select>
  );
}
