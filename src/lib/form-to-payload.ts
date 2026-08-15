import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import type { FormState } from "@/lib/form-defaults";

/**
 * Converts UI form state (percentages as 0-100, dependent fields possibly stale) into
 * the engine's request payload. Mirrors new.py's calculateAndShow(): when preheat/
 * humidification are toggled off, their dependent fields are forced to sentinel values
 * rather than trusting whatever was last typed into the (disabled) inputs.
 */
export function formStateToPayload(form: FormState, scenario: string): ScenarioInputsPayload {
  const preheatOff = form.preheatFlag === "NO";
  const humidificationOff = form.humidificationFlag === "NO";

  return {
    scenario,
    city: form.city,
    customWeather: form.customWeather,
    fuelCostElectricity: form.fuelCostElectricity,
    fuelCostNaturalGas: form.fuelCostNaturalGas,
    ghgElectricity: form.ghgElectricity,
    ghgNaturalGas: form.ghgNaturalGas,

    preheatFlag: form.preheatFlag,
    preheatTemp: preheatOff ? 0 : form.preheatTemp,
    copPreheat: preheatOff ? 1 : form.copPreheat,
    preheatFuelSource: preheatOff ? "Electricity" : form.preheatFuelSource,
    preheatCost: preheatOff ? 0 : form.preheatCost,

    ervTech: form.ervTech,
    ervTechCost: form.ervTechCost,

    winterSensibleEff: form.winterSensibleEff / 100,
    summerSensibleEff: form.summerSensibleEff / 100,
    winterLatentEff: form.winterLatentEff / 100,
    summerLatentEff: form.summerLatentEff / 100,

    postHeatSetpoint: form.postHeatSetpoint,
    copPostheat: form.copPostheat,
    postheatFuelSource: form.postheatFuelSource,
    postErvHeatingCost: form.postErvHeatingCost,

    postCoolSetpoint: form.postCoolSetpoint,
    copCooling: form.copCooling,
    postErvCoolingCost: form.postErvCoolingCost,

    humidificationFlag: form.humidificationFlag,
    rhSetpoint: humidificationOff ? 0 : form.rhSetpoint / 100,
    copHumidification: humidificationOff ? 1 : form.copHumidification,
    humidificationFuelSource: humidificationOff ? "Electricity" : form.humidificationFuelSource,
    humidificationCost: humidificationOff ? 0 : form.humidificationCost,

    supplyFlow: form.supplyFlow,
    exhaustFlow: form.exhaustFlow,

    hours: form.hours,
    days: form.days,
    months: form.months,
  };
}
