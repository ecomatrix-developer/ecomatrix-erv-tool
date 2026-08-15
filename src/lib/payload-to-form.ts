import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import type { FormState } from "@/lib/form-defaults";

/**
 * Inverse of formStateToPayload: rehydrates a submitted scenario's wire payload into
 * form state so it can be re-rendered in <InputForm/> for editing. Region/province
 * aren't part of the payload (only city is), so they're carried over from whatever
 * location is currently selected in the form -- the location boxes are read-only
 * during row editing anyway, since city isn't an editable table column.
 */
export function payloadToFormState(payload: ScenarioInputsPayload, location: {
  region: string;
  country: string;
  province: string;
}): FormState {
  return {
    region: location.region,
    country: location.country,
    province: location.province,
    city: payload.city,
    customWeather: payload.customWeather,

    fuelCostElectricity: payload.fuelCostElectricity,
    fuelCostNaturalGas: payload.fuelCostNaturalGas,
    ghgElectricity: payload.ghgElectricity,
    ghgNaturalGas: payload.ghgNaturalGas,

    preheatFlag: payload.preheatFlag,
    preheatTemp: payload.preheatTemp,
    copPreheat: payload.copPreheat,
    preheatFuelSource: payload.preheatFuelSource,
    preheatCost: payload.preheatCost,

    ervTech: payload.ervTech,
    ervTechCost: payload.ervTechCost,

    winterSensibleEff: payload.winterSensibleEff * 100,
    summerSensibleEff: payload.summerSensibleEff * 100,
    winterLatentEff: payload.winterLatentEff * 100,
    summerLatentEff: payload.summerLatentEff * 100,

    postHeatSetpoint: payload.postHeatSetpoint,
    copPostheat: payload.copPostheat,
    postheatFuelSource: payload.postheatFuelSource,
    postErvHeatingCost: payload.postErvHeatingCost,

    postCoolSetpoint: payload.postCoolSetpoint,
    copCooling: payload.copCooling,
    postErvCoolingCost: payload.postErvCoolingCost,

    humidificationFlag: payload.humidificationFlag,
    rhSetpoint: payload.rhSetpoint * 100,
    copHumidification: payload.copHumidification,
    humidificationFuelSource: payload.humidificationFuelSource,
    humidificationCost: payload.humidificationCost,

    supplyFlow: payload.supplyFlow,
    exhaustFlow: payload.exhaustFlow,

    hours: [...payload.hours],
    days: [...payload.days],
    months: [...payload.months],
  };
}
