"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { REGION_DATA } from "@/lib/location-data/regions";
import { searchLocations, type FlatLocation } from "@/lib/location-data/flatten";
import { MiniField } from "@/components/parameter-box";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeatherFileUpload } from "@/components/weather-file-upload";
import type { CustomWeatherInput } from "@/lib/calc-engine/types";
import { Search, CheckCircle2, FileText } from "lucide-react";
import { getEpwFilename } from "@/lib/location-data/epw-files";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  region: string;
  country: string;
  province: string;
  city: string;
  /** Set when `city` came from an uploaded/saved .epw file rather than the built-in list. */
  customWeather?: CustomWeatherInput;
  onChange: (next: {
    region: string;
    country: string;
    province: string;
    city: string;
    customWeather?: CustomWeatherInput;
  }) => void;
  compact?: boolean;
  disabled?: boolean;
}

/** Type-to-search box that resolves a typed city name to its Region/Country/Province/
 * City via the weather data list or displays current custom EPW location. */
function LocationSearch({ value, onSelect, disabled }: { value: string; onSelect: (loc: FlatLocation) => void; disabled?: boolean }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal search text when value prop changes (e.g. from EPW file extraction)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const results = useMemo(() => searchLocations(query), [query]);

  function pick(loc: FlatLocation) {
    if (disabled) return;
    onSelect(loc);
    setQuery(loc.city);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Type a city name…"
          className={cn(
            "h-7 w-full rounded-md border border-slate-300 bg-white py-1 pr-2 pl-7 text-xs font-semibold text-slate-900 outline-none transition-colors",
            "placeholder:font-normal placeholder:text-slate-400 focus:border-[#1E4FD8] focus:ring-2 focus:ring-[#1E4FD8]/20",
            disabled && "cursor-not-allowed bg-slate-100 text-slate-500 opacity-70",
          )}
        />
      </div>
      {!disabled && open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white text-xs shadow-lg max-h-48 overflow-y-auto">
          {results.map((loc) => (
            <li key={`${loc.region}-${loc.country}-${loc.province}-${loc.city}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(loc)}
                className="flex w-full flex-col items-start px-2.5 py-1.5 text-left hover:bg-blue-50 cursor-pointer"
              >
                <span className="font-bold text-slate-800">{loc.city}</span>
                <span className="text-[0.65rem] text-slate-500">
                  {loc.province}, {loc.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!disabled && open && query.trim() !== "" && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[0.65rem] font-semibold text-slate-500 shadow-lg">
          Custom location active from EPW file.
        </div>
      )}
    </div>
  );
}

export function LocationPicker({ region, country, province, city, customWeather, onChange, compact, disabled }: LocationPickerProps) {
  const regions = useMemo(() => {
    const list = Object.keys(REGION_DATA);
    if (customWeather && !list.includes("Custom EPW")) {
      return ["Custom EPW", ...list];
    }
    return list;
  }, [customWeather]);

  const countries = useMemo(() => {
    if (region === "Custom EPW") return ["Uploaded File"];
    return region ? Object.keys(REGION_DATA[region] ?? {}) : [];
  }, [region]);

  const provinces = useMemo(() => {
    if (region === "Custom EPW") return ["Custom Weather"];
    return region && country ? Object.keys(REGION_DATA[region]?.[country] ?? {}) : [];
  }, [region, country]);

  const cities = useMemo(() => {
    if (region === "Custom EPW") return [city || "Custom EPW Location"];
    return region && country && province ? REGION_DATA[region]?.[country]?.[province] ?? [] : [];
  }, [region, country, province, city]);

  const triggerClass = compact ? "h-6 w-full text-[11px] font-semibold px-1.5" : "w-full font-semibold";
  const triggerSize = compact ? "sm" : "default";

  return (
    <div className={compact ? "space-y-1 text-xs" : "grid grid-cols-2 gap-2"}>
      <div>
        <MiniField label="Search City">
          <LocationSearch
            value={city}
            disabled={disabled}
            onSelect={(loc) => onChange({ ...loc, customWeather: undefined })}
          />
        </MiniField>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <MiniField label="Region">
          <Select
            value={region}
            disabled={disabled}
            onValueChange={(next) => onChange({ region: next, country: "", province: "", city: "", customWeather: undefined })}
          >
            <SelectTrigger className={triggerClass} size={triggerSize}>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MiniField>

        <MiniField label="Country">
          <Select
            value={country}
            disabled={disabled || !region}
            onValueChange={(next) => onChange({ region, country: next, province: "", city: "", customWeather: undefined })}
          >
            <SelectTrigger className={triggerClass} size={triggerSize}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MiniField>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <MiniField label="Province / State">
          <Select
            value={province}
            disabled={disabled || !country}
            onValueChange={(next) => onChange({ region, country, province: next, city: "", customWeather: undefined })}
          >
            <SelectTrigger className={triggerClass} size={triggerSize}>
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MiniField>

        <MiniField label="City">
          <Select
            value={city}
            disabled={!province}
            onValueChange={(next) => onChange({ region, country, province, city: next, customWeather: undefined })}
          >
            <SelectTrigger className={triggerClass} size={triggerSize}>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </MiniField>
      </div>

      <div>
        <MiniField label="Or Custom EPW">
          <WeatherFileUpload
            activeName={customWeather ? city : undefined}
            onSelect={(extractedName, weather) =>
              onChange({
                region: "Custom EPW",
                country: "Uploaded File",
                province: "Custom Weather",
                city: extractedName,
                customWeather: weather,
              })
            }
            onClear={() => onChange({ region: "", country: "", province: "", city: "", customWeather: undefined })}
          />
        </MiniField>
      </div>

      {city && (
        compact ? (
          <div className="flex items-center gap-1 px-1 py-0.5 text-[10px] min-w-0" title={`Active EPW File: ${getEpwFilename(city)}`}>
            <FileText className="size-3 text-[#1E4FD8] shrink-0" />
            <span className="font-extrabold text-[#1E4FD8] shrink-0">EPW:</span>
            <span className="font-semibold text-slate-800 truncate" title={getEpwFilename(city)}>
              {getEpwFilename(city)}
            </span>
          </div>
        ) : (
          <div className="col-span-2 rounded-lg border border-[#1E4FD8]/20 bg-blue-50/70 p-2 text-slate-800 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 text-[#1E4FD8] shrink-0" />
              <div className="min-w-0">
                <span className="text-[0.62rem] font-extrabold text-[#1E4FD8] uppercase tracking-wider block">Active EPW Weather File</span>
                <span className="text-[0.72rem] font-mono font-bold text-slate-900 truncate block">{getEpwFilename(city)}</span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
