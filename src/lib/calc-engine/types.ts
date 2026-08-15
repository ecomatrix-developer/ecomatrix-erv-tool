export type FuelSource = "Electricity" | "Natural Gas";
export type YesNo = "YES" | "NO";

/** Hourly weather data for a user-uploaded .epw file, sent inline with the request
 * so the calc engine doesn't need a DB round-trip -- see src/lib/epw-parser.ts. */
export interface CustomWeatherInput {
  dbt: number[]; // dry-bulb temperature, degC, index 0..8759
  rh: number[]; // relative humidity, %, index 0..8759
}

export interface ScenarioInputs {
  scenario: string;
  /** A known city name from the bundled weather-data set, OR the location name
   *  extracted from an uploaded .epw file when customWeather is present. */
  city: string;
  /** When set, the engine uses this hourly data instead of looking `city` up in the
   *  bundled weather-data.json -- populated from an uploaded/saved .epw file. */
  customWeather?: CustomWeatherInput;

  fuelCostElectricity: number;
  fuelCostNaturalGas: number;
  ghgElectricity: number;
  ghgNaturalGas: number;

  preheatFlag: YesNo;
  preheatTemp: number;
  preheatFuelSource: FuelSource;
  copPreheat: number;
  preheatCost: number;

  ervTech: string;
  ervTechCost: number;

  winterSensibleEff: number;
  summerSensibleEff: number;
  winterLatentEff: number;
  summerLatentEff: number;

  postHeatSetpoint: number;
  postheatFuelSource: FuelSource;
  copPostheat: number;
  postErvHeatingCost: number;

  postCoolSetpoint: number;
  copCooling: number;
  postErvCoolingCost: number;

  humidificationFlag: YesNo;
  /**
   * Winter design RH (source cell E3), the only RH input the current frontend exposes.
   * Summer design RH (source cell E4) is not user-configurable — it matches the live
   * template's actual behavior, hardcoded at SUMMER_DESIGN_RH (0.6 / 60%).
   */
  rhSetpoint: number;
  copHumidification: number;
  humidificationFuelSource: FuelSource;
  humidificationCost: number;

  supplyFlow: number;
  exhaustFlow: number;

  hours: Set<string>; // subset of HOURS_OF_DAY
  days: Set<string>; // subset of DAYS_OF_WEEK
  months: Set<string>; // subset of MONTHS_OF_YEAR
}

export const HOURS_OF_DAY = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
] as const;

export const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

export const MONTHS_OF_YEAR = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export interface ScenarioOutputs {
  scenario: string;
  tech: string;
  preheatFlag: YesNo;
  winterSensibleEff: number;
  summerSensibleEff: number;
  winterLatentEff: number;
  supplyFlow: number;
  exhaustFlow: number;
  copPreheat: number;
  copPostheat: number;
  copCooling: number;
  copHumidification: number;

  preheatEnergyMwh: number;
  postHeatingEnergyMwh: number;
  coolingEnergyMwh: number;
  humidificationEnergyMwh: number;
  totalEnergyMwh: number;

  totalOperationalCost: number;
  capitalCost: number;
  totalGhgTons: number;
}

export interface AnalysisRow {
  scenario: string;
  totalOaEnergyMwh: number;
  energySavingsPct: number | null; // null for BaseCase (nothing to compare against)
  totalCo2Tons: number;
  co2ReductionPct: number | null;
  capitalCost: number;
  capitalCostPremium: number | null;
  totalOperationalCost: number;
  operationalCostSaving: number | null;
  simplePaybackYears: number | null;
}

export interface CalculateResult {
  scenarios: ScenarioOutputs[]; // BaseCase + up to 4 options, in submission order
  analysis: AnalysisRow[]; // same order, BaseCase first
}
