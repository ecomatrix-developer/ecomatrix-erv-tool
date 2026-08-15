import type { YesNo } from "./types";

/** Specific heat of dry air, kJ/kg-K. Source workbook cell L3, fixed constant. */
export const SPECIFIC_HEAT_AIR = 1.005;

/**
 * Latent-heat/humidity-ratio conversion constant used only in the humidification-energy
 * formula (source workbook cell M3 = 3.01, a bare unlabeled literal — no formula, no
 * adjacent label cell). Physically a latent-heat-of-vaporization-style constant scaled
 * for the l/s flow convention. Ported verbatim per source; do not attempt to rederive.
 */
export const LATENT_CONVERSION_CONSTANT = 3.01;

/** T30 — mass-flow constant (kg/s) from a flow input in l/s (source: K3=J3*0.0012). */
export function flowToMassFlowConstant(flowLps: number): number {
  return flowLps * 0.0012;
}

/** T5 — saturation vapor pressure (kPa) from dry-bulb temperature (degC). */
export function saturationVaporPressure(dbt: number): number {
  if (dbt < 0) {
    return 0.61115 * Math.exp((23.036 - dbt / 333.7) * (dbt / (279.82 + dbt)));
  }
  return 0.61121 * Math.exp((18.678 - dbt / 234.5) * (dbt / (257.14 + dbt)));
}

/** T6 — humidity ratio (kg water / kg dry air) from saturation vapor pressure (kPa) and RH (%). */
export function humidityRatio(satVaporPressureKpa: number, rhPct: number): number {
  return (
    (0.622 * (satVaporPressureKpa / 100) * rhPct) /
    (101.325 - (satVaporPressureKpa / 100) * rhPct)
  );
}

/**
 * T7 — design-condition humidity ratio, computed inline from a fixed design temperature
 * and RH pair rather than referencing a separate saturation-pressure cell. Used for F3
 * (winter design humidity ratio, from post-heat setpoint C3 + winter RH E3) and F4
 * (summer design humidity ratio, from cooling setpoint C4 + summer RH E4).
 */
export function designHumidityRatio(designTemp: number, designRhPct: number): number {
  // T7's verbatim formula always uses the water-bulb branch of the sat-vapor-pressure
  // calc regardless of designTemp's sign (source: F3/F4 formulas hardcode this branch,
  // unlike the piecewise ice-bulb IF used by saturationVaporPressure elsewhere).
  const sp =
    0.61121 * Math.exp((18.678 - designTemp / 234.5) * (designTemp / (257.14 + designTemp)));
  return (0.622 * sp * designRhPct) / (101.325 - designRhPct * sp);
}

/**
 * T13 — ERV sensible-effectiveness blend applied to outdoor air, gated by the preheat
 * toggle. Mirrors the workbook's nested IF exactly, including the fall-through empty
 * string ("") the source returns when no branch matches (unreachable in practice given
 * the preceding branches are exhaustive, but ported faithfully rather than assumed
 * impossible).
 */
export function ervSensibleBlend(params: {
  outdoorTemp: number;
  preheatFlag: YesNo;
  preheatTemp: number;
  postHeatSetpoint: number;
  postCoolSetpoint: number;
  winterSensibleEff: number;
  summerSensibleEff: number;
  exhaustFlow: number;
  supplyFlow: number;
}): number | "" {
  const {
    outdoorTemp: t,
    preheatFlag,
    preheatTemp,
    postHeatSetpoint,
    postCoolSetpoint,
    winterSensibleEff,
    summerSensibleEff,
    exhaustFlow,
    supplyFlow,
  } = params;
  const flowRatio = exhaustFlow / supplyFlow;

  if (preheatFlag === "YES") {
    if (t < preheatTemp) {
      return preheatTemp + winterSensibleEff * (postHeatSetpoint - preheatTemp) * flowRatio;
    }
    if (t >= preheatTemp && t <= postHeatSetpoint) {
      return t + winterSensibleEff * (postHeatSetpoint - t) * flowRatio;
    }
    if (t > postHeatSetpoint && t <= postCoolSetpoint) {
      return t;
    }
    if (t > postCoolSetpoint) {
      return t + summerSensibleEff * (postCoolSetpoint - t) * flowRatio;
    }
    return "";
  }

  if (t < postHeatSetpoint) {
    return t + winterSensibleEff * (postHeatSetpoint - t) * flowRatio;
  }
  if (t >= postHeatSetpoint && t <= postCoolSetpoint) {
    return t;
  }
  if (t > postCoolSetpoint) {
    return t + summerSensibleEff * (postCoolSetpoint - t) * flowRatio;
  }
  return "";
}

/**
 * T12 — latent-effectiveness blend applied to the raw hourly humidity ratio, no
 * preheat-style toggle (always active). Uses the winter/summer design humidity ratios
 * (F3/F4) as the in-band thresholds and winter/summer LATENT effectiveness (H3/H4).
 */
export function ervLatentBlend(params: {
  rawHumidityRatio: number;
  winterDesignHumidityRatio: number; // F3
  summerDesignHumidityRatio: number; // F4
  winterLatentEff: number; // H3
  summerLatentEff: number; // H4
  exhaustFlow: number;
  supplyFlow: number;
}): number | "" {
  const {
    rawHumidityRatio: w,
    winterDesignHumidityRatio: f3,
    summerDesignHumidityRatio: f4,
    winterLatentEff: h3,
    summerLatentEff: h4,
    exhaustFlow,
    supplyFlow,
  } = params;
  const flowRatio = exhaustFlow / supplyFlow;

  if (w > f4) {
    return w + h4 * (f4 - w) * flowRatio;
  }
  if (w < f3) {
    return w + h3 * (f3 - w) * flowRatio;
  }
  if (w >= f3 && w <= f4) {
    return w;
  }
  // source's duplicate w > f4 branch, unreachable given the first branch above
  return w + h4 * (f4 - w) * flowRatio;
}

/** T10 — preheat energy (kWh) for one hour, gated by the preheat toggle, using RAW outdoor temp. */
export function preheatEnergyKwh(params: {
  preheatFlag: YesNo;
  preheatTemp: number;
  rawOutdoorTemp: number;
  massFlowConstant: number; // K3
}): number {
  const { preheatFlag, preheatTemp, rawOutdoorTemp, massFlowConstant } = params;
  if (preheatFlag === "NO") return 0;
  if (preheatTemp > rawOutdoorTemp) {
    return massFlowConstant * SPECIFIC_HEAT_AIR * (preheatTemp - rawOutdoorTemp);
  }
  return 0;
}

/** Post-heat energy (kWh) for one hour, always active, using the ERV-blended temp. */
export function postHeatEnergyKwh(params: {
  postHeatSetpoint: number;
  ervBlendedTemp: number;
  massFlowConstant: number; // K3
}): number {
  const { postHeatSetpoint, ervBlendedTemp, massFlowConstant } = params;
  if (ervBlendedTemp < postHeatSetpoint) {
    return massFlowConstant * SPECIFIC_HEAT_AIR * (postHeatSetpoint - ervBlendedTemp);
  }
  return 0;
}

/** Cooling energy (kWh) for one hour, always active, using the ERV-blended temp. */
export function coolingEnergyKwh(params: {
  postCoolSetpoint: number;
  ervBlendedTemp: number;
  massFlowConstant: number; // K3
}): number {
  const { postCoolSetpoint, ervBlendedTemp, massFlowConstant } = params;
  if (ervBlendedTemp > postCoolSetpoint) {
    return massFlowConstant * SPECIFIC_HEAT_AIR * (ervBlendedTemp - postCoolSetpoint);
  }
  return 0;
}

/**
 * Humidification energy (kWh) for one hour, always active. Source uses raw supply flow
 * (l/s, $J$3) directly rather than the mass-flow constant ($K$3, kg/s) used by the
 * sensible formulas — an apparent unit inconsistency in the workbook, ported verbatim.
 */
export function humidificationEnergyKwh(params: {
  winterDesignHumidityRatio: number; // F3
  ervLatentBlendedHumidityRatio: number;
  supplyFlowLps: number; // J3, raw l/s
}): number {
  const { winterDesignHumidityRatio, ervLatentBlendedHumidityRatio, supplyFlowLps } = params;
  if (ervLatentBlendedHumidityRatio < winterDesignHumidityRatio) {
    return (
      supplyFlowLps *
      LATENT_CONVERSION_CONSTANT *
      (winterDesignHumidityRatio - ervLatentBlendedHumidityRatio)
    );
  }
  return 0;
}

/**
 * T19 — total annual operational cost ($) for one scenario.
 *
 * Source note: the workbook's fuel-source conditional (`IF(AK5=$A$16, electricRate,
 * gasRate)`) is a tautology — AK5 is itself defined as `=$A$16`, so the comparison
 * always evaluates true regardless of which fuel source the user selects. The live
 * production tool has therefore always billed every category at the electricity rate,
 * irrespective of the preheat/postheat/humidification fuel-source dropdowns. Ported
 * verbatim (faithful-replication decision) rather than fixed — the fuel-source
 * selection currently has no effect on cost or GHG output in the real app either.
 */
export function totalOperationalCost(params: {
  preheatEnergyMwh: number;
  postHeatEnergyMwh: number;
  coolingEnergyMwh: number;
  humidificationEnergyMwh: number;
  electricityCostPerKwh: number;
}): number {
  const { preheatEnergyMwh, postHeatEnergyMwh, coolingEnergyMwh, humidificationEnergyMwh, electricityCostPerKwh } =
    params;

  const total =
    (preheatEnergyMwh + postHeatEnergyMwh + coolingEnergyMwh + humidificationEnergyMwh) *
    electricityCostPerKwh *
    1000;

  return Math.round(total);
}

/** T20 — total annual GHG (tons CO2) for one scenario. Same tautology as T19; see its comment. */
export function totalGhgTons(params: {
  preheatEnergyMwh: number;
  postHeatEnergyMwh: number;
  coolingEnergyMwh: number;
  humidificationEnergyMwh: number;
  ghgElectricity: number;
}): number {
  const { preheatEnergyMwh, postHeatEnergyMwh, coolingEnergyMwh, humidificationEnergyMwh, ghgElectricity } =
    params;

  return (
    (preheatEnergyMwh + postHeatEnergyMwh + coolingEnergyMwh + humidificationEnergyMwh) *
    ghgElectricity
  );
}

/** T21 — total capital cost ($) for one scenario. */
export function totalCapitalCost(params: {
  preheatCost: number;
  postErvHeatingCost: number;
  postErvCoolingCost: number;
  ervTechCost: number;
  humidificationCost: number;
}): number {
  const { preheatCost, postErvHeatingCost, postErvCoolingCost, ervTechCost, humidificationCost } =
    params;
  return preheatCost + postErvHeatingCost + postErvCoolingCost + ervTechCost + humidificationCost;
}

/** T25 — energy/CO2 savings % vs. baseline. Returns null when baseline total is 0 (Excel #DIV/0!). */
export function savingsPct(optionTotal: number, baselineTotal: number): number | null {
  if (baselineTotal === 0) return null;
  return 1 - optionTotal / baselineTotal;
}

/** T26 — capital cost premium vs. baseline. */
export function capitalCostPremium(optionCapitalCost: number, baselineCapitalCost: number): number {
  return optionCapitalCost - baselineCapitalCost;
}

/** T27 — operational cost saving vs. baseline. */
export function operationalCostSaving(
  baselineOperationalCost: number,
  optionOperationalCost: number,
): number {
  return baselineOperationalCost - optionOperationalCost;
}

/** T28 — simple payback (years), clamped 0-100, rounded to 2 decimals. */
export function simplePaybackYears(capitalPremium: number, operationalSaving: number): number {
  let years: number;
  if (capitalPremium === 0) {
    years = 0;
  } else if (capitalPremium > 0 && operationalSaving <= 0) {
    years = 100;
  } else if (capitalPremium < 0 && operationalSaving >= 0) {
    years = 0;
  } else if (
    capitalPremium / operationalSaving > 100 &&
    capitalPremium > 0 &&
    operationalSaving > 0
  ) {
    years = 100;
  } else if (capitalPremium > 0 && operationalSaving > 0) {
    years = capitalPremium / operationalSaving;
  } else if (capitalPremium < 0 && operationalSaving < 0) {
    years = 0;
  } else {
    years = 0;
  }
  return Math.round(years * 100) / 100;
}
