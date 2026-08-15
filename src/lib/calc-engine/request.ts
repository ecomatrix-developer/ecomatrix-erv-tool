import { CITIES } from "./weather-data";
import {
  DAYS_OF_WEEK,
  HOURS_OF_DAY,
  MONTHS_OF_YEAR,
  type CustomWeatherInput,
  type FuelSource,
  type ScenarioInputs,
  type YesNo,
} from "./types";

const EXPECTED_HOURS = 8760;

/** Wire-format scenario payload: identical to ScenarioInputs but hours/days/months are
 * plain string arrays (JSON has no Set type) rather than Set<string>. */
export interface ScenarioInputsPayload extends Omit<ScenarioInputs, "hours" | "days" | "months"> {
  hours: string[];
  days: string[];
  months: string[];
}

export interface CalculateRequestBody {
  scenarios: ScenarioInputsPayload[];
}

class ValidationError extends Error {}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`);
  }
  return value;
}

/** Like assertString, but an empty string is allowed (free-text label fields). */
function assertOptionalString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  return value;
}

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new ValidationError(`${field} must be a number`);
  }
  return value;
}

function assertYesNo(value: unknown, field: string): YesNo {
  if (value !== "YES" && value !== "NO") {
    throw new ValidationError(`${field} must be "YES" or "NO"`);
  }
  return value;
}

function assertFuelSource(value: unknown, field: string): FuelSource {
  if (value !== "Electricity" && value !== "Natural Gas") {
    throw new ValidationError(`${field} must be "Electricity" or "Natural Gas"`);
  }
  return value;
}

function assertStringArraySubset(
  value: unknown,
  allowed: readonly string[],
  field: string,
): string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new ValidationError(`${field} must be an array of strings`);
  }
  const invalid = value.filter((v) => !allowed.includes(v));
  if (invalid.length > 0) {
    throw new ValidationError(`${field} contains invalid values: ${invalid.join(", ")}`);
  }
  return value;
}

function assertHourlyNumberArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value) || value.length !== EXPECTED_HOURS || !value.every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new ValidationError(`${field} must be an array of exactly ${EXPECTED_HOURS} finite numbers`);
  }
  return value;
}

function assertCustomWeather(value: unknown, field: string): CustomWeatherInput | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object") {
    throw new ValidationError(`${field} must be an object with dbt and rh arrays`);
  }
  const v = value as Record<string, unknown>;
  return {
    dbt: assertHourlyNumberArray(v.dbt, `${field}.dbt`),
    rh: assertHourlyNumberArray(v.rh, `${field}.rh`),
  };
}

/** Validates and normalizes one scenario's raw JSON payload into a typed ScenarioInputs. */
export function parseScenarioInputs(raw: unknown, index: number): ScenarioInputs {
  if (typeof raw !== "object" || raw === null) {
    throw new ValidationError(`scenarios[${index}] must be an object`);
  }
  const r = raw as Record<string, unknown>;
  const ctx = (field: string) => `scenarios[${index}].${field}`;

  const city = assertString(r.city, ctx("city"));
  const customWeather = assertCustomWeather(r.customWeather, ctx("customWeather"));
  // A known bundled city still needs to be in CITIES; a scenario carrying its own
  // hourly customWeather data supplies a location name instead, so it's exempt.
  if (!customWeather && !CITIES.includes(city)) {
    throw new ValidationError(`${ctx("city")}: unknown city "${city}"`);
  }

  return {
    scenario: assertString(r.scenario, ctx("scenario")),
    city,
    customWeather,
    fuelCostElectricity: assertNumber(r.fuelCostElectricity, ctx("fuelCostElectricity")),
    fuelCostNaturalGas: assertNumber(r.fuelCostNaturalGas, ctx("fuelCostNaturalGas")),
    ghgElectricity: assertNumber(r.ghgElectricity, ctx("ghgElectricity")),
    ghgNaturalGas: assertNumber(r.ghgNaturalGas, ctx("ghgNaturalGas")),
    preheatFlag: assertYesNo(r.preheatFlag, ctx("preheatFlag")),
    preheatTemp: assertNumber(r.preheatTemp, ctx("preheatTemp")),
    preheatFuelSource: assertFuelSource(r.preheatFuelSource, ctx("preheatFuelSource")),
    copPreheat: assertNumber(r.copPreheat, ctx("copPreheat")),
    preheatCost: assertNumber(r.preheatCost, ctx("preheatCost")),
    ervTech: assertOptionalString(r.ervTech, ctx("ervTech")),
    ervTechCost: assertNumber(r.ervTechCost, ctx("ervTechCost")),
    winterSensibleEff: assertNumber(r.winterSensibleEff, ctx("winterSensibleEff")),
    summerSensibleEff: assertNumber(r.summerSensibleEff, ctx("summerSensibleEff")),
    winterLatentEff: assertNumber(r.winterLatentEff, ctx("winterLatentEff")),
    summerLatentEff: assertNumber(r.summerLatentEff, ctx("summerLatentEff")),
    postHeatSetpoint: assertNumber(r.postHeatSetpoint, ctx("postHeatSetpoint")),
    postheatFuelSource: assertFuelSource(r.postheatFuelSource, ctx("postheatFuelSource")),
    copPostheat: assertNumber(r.copPostheat, ctx("copPostheat")),
    postErvHeatingCost: assertNumber(r.postErvHeatingCost, ctx("postErvHeatingCost")),
    postCoolSetpoint: assertNumber(r.postCoolSetpoint, ctx("postCoolSetpoint")),
    copCooling: assertNumber(r.copCooling, ctx("copCooling")),
    postErvCoolingCost: assertNumber(r.postErvCoolingCost, ctx("postErvCoolingCost")),
    humidificationFlag: assertYesNo(r.humidificationFlag, ctx("humidificationFlag")),
    rhSetpoint: assertNumber(r.rhSetpoint, ctx("rhSetpoint")),
    copHumidification: assertNumber(r.copHumidification, ctx("copHumidification")),
    humidificationFuelSource: assertFuelSource(
      r.humidificationFuelSource,
      ctx("humidificationFuelSource"),
    ),
    humidificationCost: assertNumber(r.humidificationCost, ctx("humidificationCost")),
    supplyFlow: assertNumber(r.supplyFlow, ctx("supplyFlow")),
    exhaustFlow: assertNumber(r.exhaustFlow, ctx("exhaustFlow")),
    hours: new Set(assertStringArraySubset(r.hours, HOURS_OF_DAY, ctx("hours"))),
    days: new Set(assertStringArraySubset(r.days, DAYS_OF_WEEK, ctx("days"))),
    months: new Set(assertStringArraySubset(r.months, MONTHS_OF_YEAR, ctx("months"))),
  };
}

export function parseCalculateRequest(body: unknown): ScenarioInputs[] {
  if (typeof body !== "object" || body === null || !("scenarios" in body)) {
    throw new ValidationError('Request body must be an object with a "scenarios" array');
  }
  const scenarios = (body as { scenarios: unknown }).scenarios;
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new ValidationError("scenarios must be a non-empty array");
  }
  if (scenarios.length > 5) {
    throw new ValidationError("scenarios may contain at most 5 entries (BaseCase + 4 options)");
  }
  return scenarios.map((s, i) => parseScenarioInputs(s, i));
}

export { ValidationError };
