import { describe, expect, it } from "vitest";
import { runScenario } from "../engine";
import type { ScenarioInputs } from "../types";
import { DAYS_OF_WEEK, HOURS_OF_DAY, MONTHS_OF_YEAR } from "../types";
import basecasePune from "./fixtures/basecase-pune.json";

const ALL_HOURS = new Set<string>(HOURS_OF_DAY);
const ALL_DAYS = new Set<string>(DAYS_OF_WEEK);
const ALL_MONTHS = new Set<string>(MONTHS_OF_YEAR);

function toScenarioInputs(raw: typeof basecasePune.inputs): ScenarioInputs {
  return {
    ...raw,
    preheatFlag: raw.preheatFlag as ScenarioInputs["preheatFlag"],
    preheatFuelSource: raw.preheatFuelSource as ScenarioInputs["preheatFuelSource"],
    postheatFuelSource: raw.postheatFuelSource as ScenarioInputs["postheatFuelSource"],
    humidificationFlag: raw.humidificationFlag as ScenarioInputs["humidificationFlag"],
    humidificationFuelSource: raw.humidificationFuelSource as ScenarioInputs["humidificationFuelSource"],
    hours: ALL_HOURS,
    days: ALL_DAYS,
    months: ALL_MONTHS,
  };
}

describe("engine golden-output regression: BaseCase, Pune, full year", () => {
  const inputs = toScenarioInputs(basecasePune.inputs);
  const result = runScenario(inputs);
  const expected = basecasePune.expectedOutputs;
  const tol = basecasePune.tolerances;

  it("matches the workbook's cached preheat energy (MWh)", () => {
    expect(result.preheatEnergyMwh).toBeCloseTo(expected.preheatEnergyMwh, 1);
  });

  it("matches the workbook's cached post-heating energy (MWh)", () => {
    expect(Math.abs(result.postHeatingEnergyMwh - expected.postHeatingEnergyMwh)).toBeLessThan(
      tol.energyMwh,
    );
  });

  it("matches the workbook's cached cooling energy (MWh)", () => {
    expect(Math.abs(result.coolingEnergyMwh - expected.coolingEnergyMwh)).toBeLessThan(
      tol.energyMwh,
    );
  });

  it("matches the workbook's cached humidification energy (MWh)", () => {
    expect(Math.abs(result.humidificationEnergyMwh - expected.humidificationEnergyMwh)).toBeLessThan(
      tol.energyMwh,
    );
  });

  it("matches the workbook's cached total energy (MWh)", () => {
    expect(Math.abs(result.totalEnergyMwh - expected.totalEnergyMwh)).toBeLessThan(tol.energyMwh);
  });

  it("matches the workbook's cached total operational cost ($)", () => {
    expect(Math.abs(result.totalOperationalCost - expected.totalOperationalCost)).toBeLessThan(
      tol.cost,
    );
  });

  it("matches the workbook's cached total GHG (tons CO2)", () => {
    expect(Math.abs(result.totalGhgTons - expected.totalGhgTons)).toBeLessThan(tol.ghgTons);
  });

  it("matches the workbook's cached capital cost ($)", () => {
    expect(result.capitalCost).toBe(expected.capitalCost);
  });
});
