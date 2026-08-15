"use client";

import { useRef, useState, useCallback } from "react";
import { parseEpwFile, EpwParseError } from "@/lib/epw-parser";
import {
  saveCustomWeather,
  listCustomWeather,
  getCustomWeather,
  deleteCustomWeather,
  type CustomWeatherSummary,
} from "@/app/actions/weather";
import type { CustomWeatherInput } from "@/lib/calc-engine/types";
import { Upload, FileUp, CheckCircle2, Loader2, X, Trash2, CloudUpload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherFileUploadProps {
  /** Currently-selected custom weather, if any (so the UI can show what's active). */
  activeName: string | undefined;
  onSelect: (name: string, weather: CustomWeatherInput) => void;
  onClear: () => void;
}

export function WeatherFileUpload({ activeName, onSelect, onClear }: WeatherFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ name: string; filename: string; weather: CustomWeatherInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<CustomWeatherSummary[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const refreshSaved = useCallback(() => {
    setLoadingSaved(true);
    listCustomWeather()
      .then(setSaved)
      .finally(() => setLoadingSaved(false));
  }, []);

  function handleOpenModal() {
    setOpen(true);
    refreshSaved();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setParsing(true);
    try {
      const parsed = await parseEpwFile(file);
      const customWeather: CustomWeatherInput = { dbt: parsed.dbt, rh: parsed.rh };
      setPendingUpload({ name: parsed.locationName, filename: file.name, weather: customWeather });
      onSelect(parsed.locationName, customWeather);
    } catch (err) {
      setError(err instanceof EpwParseError ? err.message : "Could not read this file as a weather file (.epw / .fwt).");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!pendingUpload) return;
    setSaving(true);
    try {
      const result = await saveCustomWeather(pendingUpload.name, pendingUpload.filename, pendingUpload.weather.dbt, pendingUpload.weather.rh);
      if ("error" in result) {
        setError(result.error);
      } else {
        setPendingUpload(null);
        refreshSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePickSaved(id: string) {
    setError(null);
    const data = await getCustomWeather(id);
    if (!data) {
      setError("Could not load this saved weather file.");
      return;
    }
    onSelect(data.name, { dbt: data.dbt, rh: data.rh });
    setPendingUpload(null);
    setOpen(false);
  }

  async function handleDeleteSaved(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteCustomWeather(id);
    refreshSaved();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs",
          activeName
            ? "border-[#1E4FD8] bg-blue-50/80 text-[#1E4FD8]"
            : "border-slate-300 bg-white text-slate-700 hover:border-[#1E4FD8] hover:text-[#1E4FD8]",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <CloudUpload className="size-4 shrink-0 text-[#1E4FD8]" />
          <span className="truncate">{activeName ? `EPW: ${activeName}` : "Upload weather file (.epw)"}</span>
        </span>
        {activeName ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setPendingUpload(null);
            }}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            title="Clear EPW File"
          >
            <X className="size-4" />
          </span>
        ) : (
          <span className="text-[0.65rem] font-bold text-[#1E4FD8] underline">Browse</span>
        )}
      </button>

      {/* Center Modal Dialog (Prevents container clipping) */}
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#1E4FD8]">
                  <CloudUpload className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload EPW Weather File</h3>
                  <p className="text-xs text-slate-500">Custom 8,760 hourly climate simulation data</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".epw"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Dropzone / Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center transition-all hover:border-[#1E4FD8] hover:bg-blue-50/30 disabled:opacity-60 cursor-pointer"
            >
              {parsing ? (
                <Loader2 className="size-8 animate-spin text-[#1E4FD8]" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-[#1E4FD8]">
                  <Upload className="size-6" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {parsing ? "Parsing 8,760 Hourly Data Points…" : "Click to select a .epw weather file"}
                </p>
                <p className="mt-0.5 text-[0.65rem] font-medium text-slate-500">
                  Standard EnergyPlus Weather format (.epw)
                </p>
              </div>
            </button>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-600">
                {error}
              </p>
            )}

            {/* Successfully Loaded Pending File */}
            {pendingUpload && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span>{pendingUpload.name}</span>
                </div>
                <p className="text-[0.7rem] font-semibold text-emerald-800">
                  Loaded from <span className="font-bold">{pendingUpload.filename}</span> — active for this simulation.
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                  {saving ? "Saving to Account…" : "Save to My Account for Reuse"}
                </button>
              </div>
            )}

            {/* Saved Custom Weather Files */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <h4 className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                Saved Weather Files in Account
              </h4>

              {loadingSaved ? (
                <div className="flex items-center gap-2 py-3 text-xs font-medium text-slate-400">
                  <Loader2 className="size-4 animate-spin text-[#1E4FD8]" /> Loading saved files…
                </div>
              ) : saved.length === 0 ? (
                <p className="py-2 text-xs font-semibold text-slate-400">No saved custom weather files yet.</p>
              ) : (
                <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {saved.map((w) => (
                    <li key={w.id}>
                      <div
                        onClick={() => handlePickSaved(w.id)}
                        className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#1E4FD8] hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-4 text-[#1E4FD8] shrink-0" />
                          <span className="truncate">{w.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSaved(w.id, e)}
                          className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete saved file"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
