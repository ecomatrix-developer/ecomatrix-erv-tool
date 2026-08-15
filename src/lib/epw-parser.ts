/**
 * Parser for EnergyPlus Weather (.epw) files -- the standard hourly TMY weather-file
 * format. Structure: 8 header lines, then exactly 8760 comma-separated hourly data
 * rows (365 days x 24 hours, non-leap-year layout matching this app's calc engine).
 *
 * Header line 1: LOCATION,<city name>,<state/province>,<country>,<source>,<WMO#>,
 *   <lat>,<lon>,<tz>,<elevation>
 * Data row fields (0-indexed): 0 year, 1 month, 2 day, 3 hour, 4 minute, 5 data-source
 *   flags, 6 dry-bulb temp (C), 7 dew-point temp (C), 8 relative humidity (%), ...
 *
 * Reference: https://bigladdersoftware.com/epx/docs/9-6/auxiliary-programs/energyplus-weather-file-epw-data-dictionary.html
 */

export interface ParsedEpw {
  /** Location name extracted from the LOCATION header line, e.g. "CALGARY INTL A". */
  locationName: string;
  /** Dry-bulb temperature, degC, index 0..8759 = hour 0..8759 of a 365-day year. */
  dbt: number[];
  /** Relative humidity, %, same indexing as dbt. */
  rh: number[];
}

export class EpwParseError extends Error {}

const EXPECTED_HOURS = 8760;
const HEADER_LINES = 8;
const DBT_FIELD_INDEX = 6;
const RH_FIELD_INDEX = 8;

export function parseEpw(text: string): ParsedEpw {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < HEADER_LINES + 1) {
    throw new EpwParseError("File is too short to be a valid EPW weather file.");
  }

  const locationLine = lines[0];
  if (!locationLine.toUpperCase().startsWith("LOCATION")) {
    throw new EpwParseError('First line must start with "LOCATION" -- this does not look like an EPW file.');
  }
  const locationFields = locationLine.split(",");
  const city = (locationFields[1] ?? "").trim();
  const state = (locationFields[2] ?? "").trim();
  const country = (locationFields[3] ?? "").trim();

  const locationParts = [city, state, country].filter((p) => p.length > 0 && p.toUpperCase() !== "N/A" && p !== "-");
  const locationName = locationParts.join(", ") || city || "Custom Location";

  const dataLines = lines.slice(HEADER_LINES);
  if (dataLines.length < EXPECTED_HOURS) {
    throw new EpwParseError(
      `Expected ${EXPECTED_HOURS} hourly data rows, found ${dataLines.length}. The file may be truncated or use a leap year.`,
    );
  }

  const dbt: number[] = new Array(EXPECTED_HOURS);
  const rh: number[] = new Array(EXPECTED_HOURS);

  for (let i = 0; i < EXPECTED_HOURS; i++) {
    const fields = dataLines[i].split(",");
    const dbtVal = Number(fields[DBT_FIELD_INDEX]);
    const dewVal = Number(fields[7]);
    let rhVal = Number(fields[RH_FIELD_INDEX]);

    if (!Number.isFinite(dbtVal)) {
      throw new EpwParseError(`Row ${i + 1} of the hourly data has an invalid temperature value.`);
    }

    if (!Number.isFinite(rhVal) || rhVal < 0 || rhVal > 100) {
      if (Number.isFinite(dewVal)) {
        rhVal = Math.round(calcRh(dbtVal, dewVal) * 10) / 10;
      } else {
        rhVal = 50;
      }
    }

    dbt[i] = Math.round(dbtVal * 100) / 100;
    rh[i] = Math.round(rhVal * 10) / 10;
  }

  return { locationName, dbt, rh };
}

function satVaporPress(t: number): number {
  return 610.78 * Math.exp((17.27 * t) / (237.3 + t));
}

function calcRh(dbt: number, dew: number): number {
  const d = dew > dbt ? dbt : dew;
  const satDbt = satVaporPress(dbt);
  const satDew = satVaporPress(d);
  return Math.max(0, Math.min(100, (satDew / satDbt) * 100));
}

export function parseFwtBuffer(buffer: ArrayBuffer, filename = "Custom Location"): ParsedEpw {
  const view = new DataView(buffer);
  const HEADER_SIZE = 1248;
  const RECORD_SIZE = 52;
  const EXPECTED_BYTES = HEADER_SIZE + 8760 * RECORD_SIZE;

  if (buffer.byteLength < EXPECTED_BYTES) {
    throw new EpwParseError("FWT file is too short to contain 8760 hourly records.");
  }

  const dbt: number[] = new Array(8760);
  const rh: number[] = new Array(8760);

  for (let i = 0; i < 8760; i++) {
    const offset = HEADER_SIZE + i * RECORD_SIZE;
    const dbtVal = view.getFloat32(offset + 12, true);
    const dewVal = view.getFloat32(offset + 16, true);
    dbt[i] = Math.round(dbtVal * 100) / 100;
    rh[i] = Math.round(calcRh(dbtVal, dewVal) * 10) / 10;
  }

  const cleanName = filename.replace(/\.(fwt|epw)$/i, "").replace(/[_.]/g, " ");

  return {
    locationName: cleanName || "Custom Location",
    dbt,
    rh,
  };
}

/** Reads a File (.epw or .fwt from an <input type="file"> or drag-and-drop) and parses weather data. */
export async function parseEpwFile(file: File): Promise<ParsedEpw> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".fwt")) {
    const buffer = await file.arrayBuffer();
    return parseFwtBuffer(buffer, file.name);
  } else if (lowerName.endsWith(".epw")) {
    const text = await file.text();
    return parseEpw(text);
  } else {
    throw new EpwParseError('File must have a ".epw" or ".fwt" extension.');
  }
}
