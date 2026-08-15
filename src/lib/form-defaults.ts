import {
  DAYS_OF_WEEK,
  HOURS_OF_DAY,
  MONTHS_OF_YEAR,
  type CustomWeatherInput,
  type FuelSource,
  type YesNo,
} from "@/lib/calc-engine/types";

export interface FormState {
  region: string;
  country: string;
  province: string;
  city: string;
  /** Set when `city` comes from an uploaded/saved .epw file instead of the bundled
   *  weather-data.json -- carries the hourly data straight through to the calc
   *  engine, and its presence is what tells the UI this location is custom. */
  customWeather?: CustomWeatherInput;

  fuelCostElectricity: number;
  fuelCostNaturalGas: number;
  ghgElectricity: number;
  ghgNaturalGas: number;

  preheatFlag: YesNo;
  preheatTemp: number;
  copPreheat: number;
  preheatFuelSource: FuelSource;
  preheatCost: number;

  ervTech: string;
  ervTechCost: number;

  winterSensibleEff: number;
  summerSensibleEff: number;
  winterLatentEff: number;
  summerLatentEff: number;

  postHeatSetpoint: number;
  copPostheat: number;
  postheatFuelSource: FuelSource;
  postErvHeatingCost: number;

  postCoolSetpoint: number;
  copCooling: number;
  postErvCoolingCost: number;

  humidificationFlag: YesNo;
  rhSetpoint: number;
  copHumidification: number;
  humidificationFuelSource: FuelSource;
  humidificationCost: number;

  supplyFlow: number;
  exhaustFlow: number;

  hours: string[];
  days: string[];
  months: string[];
}

export const DEFAULT_FORM_STATE: FormState = {
  region: "",
  country: "",
  province: "",
  city: "",

  fuelCostElectricity: 0.14,
  fuelCostNaturalGas: 0.0379,
  ghgElectricity: 0.05,
  ghgNaturalGas: 1.899,

  preheatFlag: "YES",
  preheatTemp: -5,
  copPreheat: 1,
  preheatFuelSource: "Electricity",
  preheatCost: 0,

  ervTech: "",
  ervTechCost: 0,

  winterSensibleEff: 60,
  summerSensibleEff: 0,
  winterLatentEff: 0,
  summerLatentEff: 0,

  postHeatSetpoint: 20,
  copPostheat: 1,
  postheatFuelSource: "Electricity",
  postErvHeatingCost: 0,

  postCoolSetpoint: 24,
  copCooling: 1,
  postErvCoolingCost: 0,

  humidificationFlag: "NO",
  rhSetpoint: 50,
  copHumidification: 1,
  humidificationFuelSource: "Electricity",
  humidificationCost: 0,

  supplyFlow: 9000,
  exhaustFlow: 9000,

  hours: [...HOURS_OF_DAY],
  days: [...DAYS_OF_WEEK],
  months: [...MONTHS_OF_YEAR],
};
