import {
  DAYS_OF_WEEK,
  HOURS_OF_DAY,
  MONTHS_OF_YEAR,
  type AnalysisRow,
  type CalculateResult,
  type ScenarioInputs,
  type ScenarioOutputs,
} from "./types";
import { getCityWeather, type CityHourlyWeather } from "./weather-data";
import {
  capitalCostPremium,
  coolingEnergyKwh,
  designHumidityRatio,
  ervLatentBlend,
  ervSensibleBlend,
  flowToMassFlowConstant,
  humidificationEnergyKwh,
  humidityRatio,
  operationalCostSaving,
  postHeatEnergyKwh,
  preheatEnergyKwh,
  saturationVaporPressure,
  savingsPct,
  simplePaybackYears,
  totalCapitalCost,
  totalGhgTons,
  totalOperationalCost,
} from "./formulas";

/** Summer design RH (source cell E4) — not user-configurable, matches the live template. */
const SUMMER_DESIGN_RH = 0.6;

/** Days per calendar month, non-leap year, matching the source workbook's 365-day layout. */
const DAYS_IN_MONTH: Record<(typeof MONTHS_OF_YEAR)[number], number> = {
  January: 31,
  February: 28,
  March: 31,
  April: 30,
  May: 31,
  June: 30,
  July: 31,
  August: 31,
  September: 30,
  October: 31,
  November: 30,
  December: 31,
};

/** Day-of-year (0-indexed) that each month starts on, non-leap year. */
const MONTH_START_DAY_OF_YEAR: Record<(typeof MONTHS_OF_YEAR)[number], number> = (() => {
  const result = {} as Record<(typeof MONTHS_OF_YEAR)[number], number>;
  let offset = 0;
  for (const month of MONTHS_OF_YEAR) {
    result[month] = offset;
    offset += DAYS_IN_MONTH[month];
  }
  return result;
})();

/** Pre-computed array mapping dayOfYear (0..364) to month name for sub-millisecond lookup. */
const DAY_OF_YEAR_MONTH: Array<(typeof MONTHS_OF_YEAR)[number]> = (() => {
  const result: Array<(typeof MONTHS_OF_YEAR)[number]> = new Array(365);
  for (let dayOfYear = 0; dayOfYear < 365; dayOfYear++) {
    for (const month of MONTHS_OF_YEAR) {
      if (
        dayOfYear >= MONTH_START_DAY_OF_YEAR[month] &&
        dayOfYear < MONTH_START_DAY_OF_YEAR[month] + DAYS_IN_MONTH[month]
      ) {
        result[dayOfYear] = month;
        break;
      }
    }
  }
  return result;
})();

interface ExtendedWeather extends CityHourlyWeather {
  _satPressure?: Float64Array;
  _rawHumidityRatio?: Float64Array;
}

/** Pre-computes saturated vapor pressure and raw humidity ratio for all 8760 hours of a weather object. */
function getPrecomputedWeatherArrays(weather: CityHourlyWeather): {
  satPressure: Float64Array;
  rawHumidityRatio: Float64Array;
} {
  const ext = weather as ExtendedWeather;
  if (ext._satPressure && ext._rawHumidityRatio) {
    return { satPressure: ext._satPressure, rawHumidityRatio: ext._rawHumidityRatio };
  }

  const len = weather.dbt.length;
  const satPressure = new Float64Array(len);
  const rawHumidityRatio = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const sp = saturationVaporPressure(weather.dbt[i]);
    satPressure[i] = sp;
    rawHumidityRatio[i] = humidityRatio(sp, weather.rh[i]);
  }

  ext._satPressure = satPressure;
  ext._rawHumidityRatio = rawHumidityRatio;
  return { satPressure, rawHumidityRatio };
}

interface HourAccumulators {
  preheatKwh: number;
  postHeatKwh: number;
  coolingKwh: number;
  humidificationKwh: number;
}

/**
 * Runs the fast 8760-hour engine for one scenario.
 */
function computeAnnualEnergy(inputs: ScenarioInputs): HourAccumulators {
  const weather = inputs.customWeather ?? getCityWeather(inputs.city);
  const { rawHumidityRatio } = getPrecomputedWeatherArrays(weather);

  const massFlowConstant = flowToMassFlowConstant(inputs.supplyFlow);
  const winterDesignHumidityRatio = designHumidityRatio(inputs.postHeatSetpoint, inputs.rhSetpoint);
  const summerDesignHumidityRatio = designHumidityRatio(inputs.postCoolSetpoint, SUMMER_DESIGN_RH);

  // Build a fast 8,760 bitmask array for active hours
  const activeHours = new Uint8Array(8760);
  for (let dayOfYear = 0; dayOfYear < 365; dayOfYear++) {
    const dayOfWeek = DAYS_OF_WEEK[dayOfYear % 7];
    if (!inputs.days.has(dayOfWeek)) continue;

    const month = DAY_OF_YEAR_MONTH[dayOfYear];
    if (!inputs.months.has(month)) continue;

    const baseIndex = dayOfYear * 24;
    for (let hourOfDay = 0; hourOfDay < 24; hourOfDay++) {
      const hourLabel = HOURS_OF_DAY[hourOfDay];
      if (inputs.hours.has(hourLabel)) {
        activeHours[baseIndex + hourOfDay] = 1;
      }
    }
  }

  const totals: HourAccumulators = {
    preheatKwh: 0,
    postHeatKwh: 0,
    coolingKwh: 0,
    humidificationKwh: 0,
  };

  const dbt = weather.dbt;
  const preheatFlag = inputs.preheatFlag;
  const preheatTemp = inputs.preheatTemp;
  const postHeatSetpoint = inputs.postHeatSetpoint;
  const postCoolSetpoint = inputs.postCoolSetpoint;
  const winterSensibleEff = inputs.winterSensibleEff;
  const summerSensibleEff = inputs.summerSensibleEff;
  const winterLatentEff = inputs.winterLatentEff;
  const summerLatentEff = inputs.summerLatentEff;
  const exhaustFlow = inputs.exhaustFlow;
  const supplyFlow = inputs.supplyFlow;

  for (let hourOfYear = 0; hourOfYear < 8760; hourOfYear++) {
    if (activeHours[hourOfYear] === 0) continue;

    const rawOutdoorTemp = dbt[hourOfYear];

    const ervBlend = ervSensibleBlend({
      outdoorTemp: rawOutdoorTemp,
      preheatFlag,
      preheatTemp,
      postHeatSetpoint,
      postCoolSetpoint,
      winterSensibleEff,
      summerSensibleEff,
      exhaustFlow,
      supplyFlow,
    });
    const ervBlendedTemp = ervBlend === "" ? rawOutdoorTemp : ervBlend;

    totals.preheatKwh += preheatEnergyKwh({
      preheatFlag,
      preheatTemp,
      rawOutdoorTemp,
      massFlowConstant,
    });
    totals.postHeatKwh += postHeatEnergyKwh({
      postHeatSetpoint,
      ervBlendedTemp,
      massFlowConstant,
    });
    totals.coolingKwh += coolingEnergyKwh({
      postCoolSetpoint,
      ervBlendedTemp,
      massFlowConstant,
    });

    const rawHr = rawHumidityRatio[hourOfYear];
    const latentBlend = ervLatentBlend({
      rawHumidityRatio: rawHr,
      winterDesignHumidityRatio,
      summerDesignHumidityRatio,
      winterLatentEff,
      summerLatentEff,
      exhaustFlow,
      supplyFlow,
    });
    const ervLatentBlendedHumidityRatio = latentBlend === "" ? rawHr : latentBlend;

    totals.humidificationKwh += humidificationEnergyKwh({
      winterDesignHumidityRatio,
      ervLatentBlendedHumidityRatio,
      supplyFlowLps: supplyFlow,
    });
  }

  return totals;
}

function kwhToMwh(kwh: number): number {
  return kwh / 1000;
}

const scenarioCache = new Map<string, ScenarioOutputs>();

function getScenarioCacheKey(inputs: ScenarioInputs): string {
  if (inputs.customWeather) return ""; // don't cache custom uploaded weather files
  return `${inputs.scenario}_${inputs.city}_${inputs.supplyFlow}_${inputs.exhaustFlow}_${inputs.preheatFlag}_${inputs.preheatTemp}_${inputs.winterSensibleEff}_${inputs.summerSensibleEff}_${inputs.winterLatentEff}_${inputs.summerLatentEff}_${inputs.postHeatSetpoint}_${inputs.postCoolSetpoint}_${inputs.rhSetpoint}_${inputs.copPreheat}_${inputs.copPostheat}_${inputs.copCooling}_${inputs.copHumidification}_${inputs.preheatFuelSource}_${inputs.postheatFuelSource}_${inputs.humidificationFuelSource}_${inputs.ghgElectricity}_${inputs.ghgNaturalGas}_${inputs.fuelCostElectricity}_${inputs.fuelCostNaturalGas}_${inputs.preheatCost}_${inputs.postErvHeatingCost}_${inputs.postErvCoolingCost}_${inputs.ervTechCost}_${inputs.humidificationCost}_${Array.from(inputs.hours).sort().join(",")}_${Array.from(inputs.days).sort().join(",")}_${Array.from(inputs.months).sort().join(",")}`;
}

export function runScenario(inputs: ScenarioInputs): ScenarioOutputs {
  const key = getScenarioCacheKey(inputs);
  if (key && scenarioCache.has(key)) {
    return scenarioCache.get(key)!;
  }

  const { preheatKwh, postHeatKwh, coolingKwh, humidificationKwh } = computeAnnualEnergy(inputs);

  const preheatEnergyMwhRaw = kwhToMwh(preheatKwh);
  const postHeatingEnergyMwhRaw = kwhToMwh(postHeatKwh);
  const coolingEnergyMwhRaw = kwhToMwh(coolingKwh);
  const humidificationEnergyMwhRaw = kwhToMwh(humidificationKwh);

  const preheatEnergyMwh = preheatEnergyMwhRaw / inputs.copPreheat;
  const postHeatingEnergyMwh = postHeatingEnergyMwhRaw / inputs.copPostheat;
  const coolingEnergyMwh = coolingEnergyMwhRaw / inputs.copCooling;
  const humidificationEnergyMwh =
    inputs.humidificationFlag === "YES" ? humidificationEnergyMwhRaw / inputs.copHumidification : 0;

  const totalEnergyMwh =
    preheatEnergyMwh + postHeatingEnergyMwh + coolingEnergyMwh + humidificationEnergyMwh;

  const totalOpCost = totalOperationalCost({
    preheatEnergyMwh,
    postHeatEnergyMwh: postHeatingEnergyMwh,
    coolingEnergyMwh,
    humidificationEnergyMwh,
    electricityCostPerKwh: inputs.fuelCostElectricity,
  });

  const totalGhg = totalGhgTons({
    preheatEnergyMwh,
    postHeatEnergyMwh: postHeatingEnergyMwh,
    coolingEnergyMwh,
    humidificationEnergyMwh,
    ghgElectricity: inputs.ghgElectricity,
  });

  const capitalCost = totalCapitalCost({
    preheatCost: inputs.preheatCost,
    postErvHeatingCost: inputs.postErvHeatingCost,
    postErvCoolingCost: inputs.postErvCoolingCost,
    ervTechCost: inputs.ervTechCost,
    humidificationCost: inputs.humidificationCost,
  });

  const output: ScenarioOutputs = {
    scenario: inputs.scenario,
    tech: inputs.ervTech,
    preheatFlag: inputs.preheatFlag,
    winterSensibleEff: inputs.winterSensibleEff,
    summerSensibleEff: inputs.summerSensibleEff,
    winterLatentEff: inputs.winterLatentEff,
    supplyFlow: inputs.supplyFlow,
    exhaustFlow: inputs.exhaustFlow,
    copPreheat: inputs.copPreheat,
    copPostheat: inputs.copPostheat,
    copCooling: inputs.copCooling,
    copHumidification: inputs.copHumidification,
    preheatEnergyMwh,
    postHeatingEnergyMwh,
    coolingEnergyMwh,
    humidificationEnergyMwh,
    totalEnergyMwh,
    totalOperationalCost: totalOpCost,
    capitalCost,
    totalGhgTons: totalGhg,
  };

  if (key) {
    scenarioCache.set(key, output);
  }

  return output;
}

export function runAllScenarios(inputsList: ScenarioInputs[]): CalculateResult {
  const scenarios = inputsList.map(runScenario);
  const baseline = scenarios[0];

  const analysis: AnalysisRow[] = scenarios.map((s, i) => {
    if (i === 0) {
      return {
        scenario: s.scenario,
        totalOaEnergyMwh: s.totalEnergyMwh,
        energySavingsPct: null,
        totalCo2Tons: s.totalGhgTons,
        co2ReductionPct: null,
        capitalCost: s.capitalCost,
        capitalCostPremium: null,
        totalOperationalCost: s.totalOperationalCost,
        operationalCostSaving: null,
        simplePaybackYears: null,
      };
    }

    const premium = capitalCostPremium(s.capitalCost, baseline.capitalCost);
    const opSaving = operationalCostSaving(baseline.totalOperationalCost, s.totalOperationalCost);

    return {
      scenario: s.scenario,
      totalOaEnergyMwh: s.totalEnergyMwh,
      energySavingsPct: savingsPct(s.totalEnergyMwh, baseline.totalEnergyMwh),
      totalCo2Tons: s.totalGhgTons,
      co2ReductionPct: savingsPct(s.totalGhgTons, baseline.totalGhgTons),
      capitalCost: s.capitalCost,
      capitalCostPremium: premium,
      totalOperationalCost: s.totalOperationalCost,
      operationalCostSaving: opSaving,
      simplePaybackYears: simplePaybackYears(premium, opSaving),
    };
  });

  return { scenarios, analysis };
}

