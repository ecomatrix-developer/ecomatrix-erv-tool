"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Calculator,
  X,
  Copy,
  Check,
  ArrowRightLeft,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UnitCategory = "temperature" | "airflow" | "pressure" | "power" | "efficiency";

export function FloatingCalculator() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"converter" | "calculator" | "formulas">("converter");

  // Unit Converter State
  const [category, setCategory] = useState<UnitCategory>("temperature");
  const [valA, setValA] = useState<string>("20");
  const [valB, setValB] = useState<string>("68");
  const [lastEdited, setLastEdited] = useState<"A" | "B">("A");
  const [unitA, setUnitA] = useState<string>("°C");
  const [unitB, setUnitB] = useState<string>("°F");
  const [copied, setCopied] = useState<string | null>(null);

  // Math Calculator State
  const [calcDisplay, setCalcDisplay] = useState<string>("0");
  const [calcExpr, setCalcExpr] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);

  // Auto-sync conversion values when category or units change
  useEffect(() => {
    if (category === "temperature") {
      setUnitA("°C");
      setUnitB("°F");
      convertTemp("20", "°C", "°F", "A");
    } else if (category === "airflow") {
      setUnitA("L/s");
      setUnitB("CFM");
      convertAirflow("100", "L/s", "CFM", "A");
    } else if (category === "pressure") {
      setUnitA("Pa");
      setUnitB("in.w.g.");
      convertPressure("250", "Pa", "in.w.g.", "A");
    } else if (category === "power") {
      setUnitA("kW");
      setUnitB("BTU/h");
      convertPower("10", "kW", "BTU/h", "A");
    } else if (category === "efficiency") {
      setUnitA("COP");
      setUnitB("EER");
      convertEfficiency("3.5", "COP", "EER", "A");
    }
  }, [category]);

  // Temperature Conversion
  function convertTemp(val: string, fromUnit: string, toUnit: string, source: "A" | "B") {
    const num = parseFloat(val);
    if (isNaN(num)) {
      if (source === "A") setValB("");
      else setValA("");
      return;
    }

    let tempC = num;
    if (fromUnit === "°F") tempC = ((num - 32) * 5) / 9;
    if (fromUnit === "K") tempC = num - 273.15;

    let res = tempC;
    if (toUnit === "°F") res = (tempC * 9) / 5 + 32;
    if (toUnit === "K") res = tempC + 273.15;

    const formatted = String(Math.round(res * 100) / 100);
    if (source === "A") setValB(formatted);
    else setValA(formatted);
  }

  // Airflow Conversion
  function convertAirflow(val: string, fromUnit: string, toUnit: string, source: "A" | "B") {
    const num = parseFloat(val);
    if (isNaN(num)) {
      if (source === "A") setValB("");
      else setValA("");
      return;
    }

    let flowLs = num;
    if (fromUnit === "CFM") flowLs = num / 2.11888;
    if (fromUnit === "m³/h") flowLs = num / 3.6;

    let res = flowLs;
    if (toUnit === "CFM") res = flowLs * 2.11888;
    if (toUnit === "m³/h") res = flowLs * 3.6;

    const formatted = String(Math.round(res * 100) / 100);
    if (source === "A") setValB(formatted);
    else setValA(formatted);
  }

  // Pressure Conversion
  function convertPressure(val: string, fromUnit: string, toUnit: string, source: "A" | "B") {
    const num = parseFloat(val);
    if (isNaN(num)) {
      if (source === "A") setValB("");
      else setValA("");
      return;
    }

    let pa = num;
    if (fromUnit === "in.w.g.") pa = num * 248.84;
    if (fromUnit === "kPa") pa = num * 1000;

    let res = pa;
    if (toUnit === "in.w.g.") res = pa / 248.84;
    if (toUnit === "kPa") res = pa / 1000;

    const formatted = String(Math.round(res * 1000) / 1000);
    if (source === "A") setValB(formatted);
    else setValA(formatted);
  }

  // Power Conversion
  function convertPower(val: string, fromUnit: string, toUnit: string, source: "A" | "B") {
    const num = parseFloat(val);
    if (isNaN(num)) {
      if (source === "A") setValB("");
      else setValA("");
      return;
    }

    let kw = num;
    if (fromUnit === "BTU/h") kw = num / 3412.14;
    if (fromUnit === "Ton (Ref)") kw = num * 3.51685;
    if (fromUnit === "HP") kw = num * 0.7457;

    let res = kw;
    if (toUnit === "BTU/h") res = kw * 3412.14;
    if (toUnit === "Ton (Ref)") res = kw / 3.51685;
    if (toUnit === "HP") res = kw / 0.7457;

    const formatted = String(Math.round(res * 100) / 100);
    if (source === "A") setValB(formatted);
    else setValA(formatted);
  }

  // Efficiency Conversion
  function convertEfficiency(val: string, fromUnit: string, toUnit: string, source: "A" | "B") {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      if (source === "A") setValB("");
      else setValA("");
      return;
    }

    let cop = num;
    if (fromUnit === "EER") cop = num / 3.41214;
    if (fromUnit === "kW/Ton") cop = 3.51685 / num;

    let res = cop;
    if (toUnit === "EER") res = cop * 3.41214;
    if (toUnit === "kW/Ton") res = 3.51685 / cop;

    const formatted = String(Math.round(res * 100) / 100);
    if (source === "A") setValB(formatted);
    else setValA(formatted);
  }

  function handleValueChange(val: string, source: "A" | "B") {
    setLastEdited(source);
    if (source === "A") {
      setValA(val);
      dispatchConversion(val, unitA, unitB, "A");
    } else {
      setValB(val);
      dispatchConversion(val, unitB, unitA, "B");
    }
  }

  function dispatchConversion(val: string, fromUnit: string, toUnit: string, source: "A" | "B") {
    if (category === "temperature") convertTemp(val, fromUnit, toUnit, source);
    else if (category === "airflow") convertAirflow(val, fromUnit, toUnit, source);
    else if (category === "pressure") convertPressure(val, fromUnit, toUnit, source);
    else if (category === "power") convertPower(val, fromUnit, toUnit, source);
    else if (category === "efficiency") convertEfficiency(val, fromUnit, toUnit, source);
  }

  function copyToClipboard(text: string, target: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(target);
    setTimeout(() => setCopied(null), 2000);
  }

  // Keypad Calculator Handler
  function handleCalcInput(btn: string) {
    if (btn === "AC") {
      setCalcDisplay("0");
      setCalcExpr("");
      return;
    }

    if (btn === "=") {
      try {
        const sanitized = (calcExpr + calcDisplay)
          .replace(/×/g, "*")
          .replace(/÷/g, "/")
          .replace(/±/g, "-");
        // Safe evaluation for basic arithmetic
        const evalResult = Function(`'use strict'; return (${sanitized})`)();
        const finalVal = String(Math.round(Number(evalResult) * 10000) / 10000);
        setHistory((prev) => [`${calcExpr + calcDisplay} = ${finalVal}`, ...prev.slice(0, 3)]);
        setCalcDisplay(finalVal);
        setCalcExpr("");
      } catch (err) {
        setCalcDisplay("Error");
      }
      return;
    }

    if (["+", "-", "×", "÷"].includes(btn)) {
      setCalcExpr(calcExpr + calcDisplay + " " + btn + " ");
      setCalcDisplay("0");
      return;
    }

    if (btn === "±") {
      setCalcDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : "-" + prev));
      return;
    }

    if (calcDisplay === "0" || calcDisplay === "Error") {
      setCalcDisplay(btn);
    } else {
      setCalcDisplay(calcDisplay + btn);
    }
  }

  if (pathname !== "/simulator") {
    return null;
  }

  return (
    <>
      {/* Compact Floating Trigger Tab on Right Screen Edge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={cn(
          "fixed right-0 top-[59%] -translate-y-1/2 z-50 flex items-center gap-1.5 rounded-l-xl px-2.5 py-2.5 text-white shadow-xl transition-all duration-300 cursor-pointer border border-r-0 border-white/20",
          isOpen
            ? "bg-slate-900 shadow-blue-900/40"
            : "bg-[#1E4FD8] hover:bg-blue-700 hover:pl-3 shadow-blue-600/30"
        )}
        title="SI / IP & Math Calculator"
      >
        <Calculator className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline text-[0.7rem] font-extrabold tracking-wide select-none">
          Calc
        </span>
      </button>

      {/* Compact Calculator Popover Panel on Right Edge */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="fixed top-[65%] -translate-y-1/2 right-10 z-50 w-76 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-right-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/40 text-blue-300">
                <Calculator className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-[0.7rem] font-extrabold tracking-tight">SI / IP Calculator</h3>
                <p className="text-[0.6rem] text-slate-300">HVAC Unit Conversions &amp; Math</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("converter")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 rounded-md py-1 text-[0.65rem] font-extrabold transition-all cursor-pointer",
                activeTab === "converter"
                  ? "bg-white text-[#1E4FD8] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ArrowRightLeft className="h-3 w-3" />
              SI ↔ IP
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 rounded-md py-1 text-[0.65rem] font-extrabold transition-all cursor-pointer",
                activeTab === "calculator"
                  ? "bg-white text-[#1E4FD8] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Calculator className="h-3 w-3" />
              Math
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("formulas")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 rounded-md py-1 text-[0.65rem] font-extrabold transition-all cursor-pointer",
                activeTab === "formulas"
                  ? "bg-white text-[#1E4FD8] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <BookOpen className="h-3 w-3" />
              Formulas
            </button>
          </div>

          {/* TAB 1: UNIT CONVERTER */}
          {activeTab === "converter" && (
            <div className="p-3 space-y-3">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {(["temperature", "airflow", "pressure", "power", "efficiency"] as UnitCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.65rem] font-bold capitalize transition-all cursor-pointer",
                      category === cat
                        ? "bg-[#1E4FD8] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {cat === "temperature" && "🌡️ Temp"}
                    {cat === "airflow" && "💨 Airflow"}
                    {cat === "pressure" && "💧 Pressure"}
                    {cat === "power" && "⚡ Power"}
                    {cat === "efficiency" && "📊 Eff."}
                  </button>
                ))}
              </div>

              {/* Conversion Box */}
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                {/* Input A */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[0.6rem] font-extrabold text-slate-500">
                    <span>INPUT VALUE (SI)</span>
                    {copied === "A" && (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Copied!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={valA}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleValueChange(e.target.value, "A")}
                      placeholder="0"
                      className="flex-1 h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900 focus:border-[#1E4FD8] focus:ring-1 focus:ring-[#1E4FD8]/20 outline-none"
                    />
                    <select
                      value={unitA}
                      onChange={(e) => {
                        setUnitA(e.target.value);
                        handleValueChange(valA, "A");
                      }}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-1.5 text-[0.65rem] font-bold text-slate-700 outline-none"
                    >
                      {category === "temperature" && (
                        <>
                          <option value="°C">°C</option>
                          <option value="°F">°F</option>
                          <option value="K">K</option>
                        </>
                      )}
                      {category === "airflow" && (
                        <>
                          <option value="L/s">L/s</option>
                          <option value="CFM">CFM</option>
                          <option value="m³/h">m³/h</option>
                        </>
                      )}
                      {category === "pressure" && (
                        <>
                          <option value="Pa">Pa</option>
                          <option value="in.w.g.">in.w.g.</option>
                          <option value="kPa">kPa</option>
                        </>
                      )}
                      {category === "power" && (
                        <>
                          <option value="kW">kW</option>
                          <option value="BTU/h">BTU/h</option>
                          <option value="Ton (Ref)">Ton</option>
                          <option value="HP">HP</option>
                        </>
                      )}
                      {category === "efficiency" && (
                        <>
                          <option value="COP">COP</option>
                          <option value="EER">EER</option>
                          <option value="kW/Ton">kW/Ton</option>
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(valA, "A")}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                      title="Copy SI Value"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <ArrowRightLeft className="h-2.5 w-2.5" />
                  </div>
                </div>

                {/* Input B */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[0.6rem] font-extrabold text-slate-500">
                    <span>CONVERTED VALUE (IP)</span>
                    {copied === "B" && (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Copied!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={valB}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleValueChange(e.target.value, "B")}
                      placeholder="0"
                      className="flex-1 h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900 focus:border-[#1E4FD8] focus:ring-1 focus:ring-[#1E4FD8]/20 outline-none"
                    />
                    <select
                      value={unitB}
                      onChange={(e) => {
                        setUnitB(e.target.value);
                        handleValueChange(valA, "A");
                      }}
                      className="h-8 rounded-lg border border-slate-300 bg-white px-1.5 text-[0.65rem] font-bold text-slate-700 outline-none"
                    >
                      {category === "temperature" && (
                        <>
                          <option value="°F">°F</option>
                          <option value="°C">°C</option>
                          <option value="K">K</option>
                        </>
                      )}
                      {category === "airflow" && (
                        <>
                          <option value="CFM">CFM</option>
                          <option value="L/s">L/s</option>
                          <option value="m³/h">m³/h</option>
                        </>
                      )}
                      {category === "pressure" && (
                        <>
                          <option value="in.w.g.">in.w.g.</option>
                          <option value="Pa">Pa</option>
                          <option value="kPa">kPa</option>
                        </>
                      )}
                      {category === "power" && (
                        <>
                          <option value="BTU/h">BTU/h</option>
                          <option value="kW">kW</option>
                          <option value="Ton (Ref)">Ton</option>
                          <option value="HP">HP</option>
                        </>
                      )}
                      {category === "efficiency" && (
                        <>
                          <option value="EER">EER</option>
                          <option value="COP">COP</option>
                          <option value="kW/Ton">kW/Ton</option>
                        </>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(valB, "B")}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                      title="Copy IP Value"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversion Reference Hint */}
              <div className="rounded-lg bg-blue-50/70 p-2 text-[0.65rem] text-blue-900 border border-blue-100 flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Formula Hint: </span>
                  {category === "temperature" && "°F = (°C × 1.8) + 32  |  °C = (°F - 32) ÷ 1.8"}
                  {category === "airflow" && "1 L/s ≈ 2.11888 CFM  |  1 L/s = 3.6 m³/h"}
                  {category === "pressure" && "1 in.w.g. ≈ 248.84 Pa  |  1 kPa = 1000 Pa"}
                  {category === "power" && "1 kW ≈ 3,412.14 BTU/h  |  1 Ton = 12,000 BTU/h"}
                  {category === "efficiency" && "EER = COP × 3.41214  |  kW/Ton = 12 ÷ EER"}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATH CALCULATOR */}
          {activeTab === "calculator" && (
            <div className="p-3 space-y-2.5">
              {/* Calculator Display */}
              <div className="rounded-xl bg-slate-900 p-2.5 text-right text-white shadow-inner space-y-0.5">
                <div className="h-3.5 text-[0.65rem] text-slate-400 font-mono overflow-x-auto whitespace-nowrap">
                  {calcExpr || " "}
                </div>
                <div className="text-lg font-bold font-mono tracking-wide text-blue-400 overflow-x-auto whitespace-nowrap">
                  {calcDisplay}
                </div>
              </div>

              {/* Action Bar (Copy result) */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[0.6rem] text-slate-500 font-bold">Keypad</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(calcDisplay, "calc")}
                  className="flex items-center gap-1 text-[0.65rem] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {copied === "calc" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied === "calc" ? "Copied!" : "Copy Result"}
                </button>
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-4 gap-1">
                {["AC", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "±", "0", ".", "="].map(
                  (btn) => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalcInput(btn)}
                      className={cn(
                        "h-8 rounded-lg font-bold text-xs transition-all cursor-pointer active:scale-95",
                        btn === "="
                          ? "col-span-1 bg-[#1E4FD8] text-white hover:bg-blue-600 shadow-xs"
                          : ["AC"].includes(btn)
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : ["÷", "×", "-", "+", "(", ")", "±"].includes(btn)
                          ? "bg-blue-50 text-[#1E4FD8] hover:bg-blue-100 border border-blue-200"
                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                      )}
                    >
                      {btn}
                    </button>
                  )
                )}
              </div>

              {/* Recent History */}
              {history.length > 0 && (
                <div className="rounded-lg bg-slate-50 p-1.5 text-[0.6rem] text-slate-600 border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">History:</span>
                  {history.map((item, idx) => (
                    <div key={idx} className="font-mono text-slate-500 truncate">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ERV FORMULAS */}
          {activeTab === "formulas" && (
            <div className="p-3 space-y-2 text-[0.7rem]">
              <h4 className="font-bold text-slate-800">HVAC &amp; ERV Formulas</h4>

              <div className="space-y-1.5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                  <p className="font-bold text-blue-700 text-[0.65rem]">Sensible Heat Transfer</p>
                  <p className="font-mono text-[0.65rem] text-slate-800">Q_s = 1.23 × Flow (L/s) × ΔT / 1000</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                  <p className="font-bold text-blue-700 text-[0.65rem]">Airflow Unit Rule</p>
                  <p className="font-mono text-[0.65rem] text-slate-800">CFM = L/s × 2.11888</p>
                  <p className="font-mono text-[0.65rem] text-slate-800">L/s = CFM ÷ 2.11888</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                  <p className="font-bold text-blue-700 text-[0.65rem]">Temperature Conversion</p>
                  <p className="font-mono text-[0.65rem] text-slate-800">°F = (°C × 1.8) + 32</p>
                  <p className="font-mono text-[0.65rem] text-slate-800">°C = (°F - 32) ÷ 1.8</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-0.5">
                  <p className="font-bold text-blue-700 text-[0.65rem]">COP &amp; EER Relation</p>
                  <p className="font-mono text-[0.65rem] text-slate-800">EER = COP × 3.41214</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
