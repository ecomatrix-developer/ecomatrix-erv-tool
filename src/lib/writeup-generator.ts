import type { AnalysisRow, ScenarioOutputs } from "@/lib/calc-engine/types";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";

export interface WriteupResult {
  headline: string;
  bestOptionLabel: string;
  bestTechName: string;
  bestPaybackText: string;
  bestEnergySavingsPct: string;
  summaryText: string;
  stageBreakdownText: string;
  financialText: string;
  recommendationText: string;
}

export function generateAnalysisWriteup(
  analysis: AnalysisRow[],
  scenarios: ScenarioOutputs[],
  payloads: ScenarioInputsPayload[] = [],
): WriteupResult {
  if (!analysis || analysis.length === 0) {
    return {
      headline: "No Simulation Data Available",
      bestOptionLabel: "N/A",
      bestTechName: "N/A",
      bestPaybackText: "N/A",
      bestEnergySavingsPct: "0%",
      summaryText: "Please run at least one ERV scenario to generate detailed analysis insights.",
      stageBreakdownText: "",
      financialText: "",
      recommendationText: "",
    };
  }

  const baseRow = analysis[0];
  const baseScenario = scenarios[0];
  const optionRows = analysis.slice(1);

  if (optionRows.length === 0) {
    return {
      headline: "Baseline Energy Profile Formulated",
      bestOptionLabel: "BaseCase",
      bestTechName: payloads[0]?.ervTech || "Baseline HVAC",
      bestPaybackText: "Baseline",
      bestEnergySavingsPct: "0%",
      summaryText: `BaseCase conventional HVAC operating profile initialized for ${payloads[0]?.city || "the selected location"} with total annual energy consumption of ${baseRow.totalOaEnergyMwh.toLocaleString("en-US", { maximumFractionDigits: 1 })} MWh and an annual operating cost of $${Math.round(baseRow.totalOperationalCost).toLocaleString("en-US")}.`,
      stageBreakdownText: "Add ERV Option scenarios to calculate comparative energy savings, operating cost reductions, and payback periods.",
      financialText: "Financial ROI metrics will calculate automatically when options are created.",
      recommendationText: "Configure Option 1 in the simulator above to evaluate Energy Recovery Ventilation performance against this baseline.",
    };
  }

  // Helper to format clean technology name without repeating scenario label
  const getTechName = (row: AnalysisRow) => {
    const idx = analysis.findIndex((r) => r.scenario === row.scenario);
    const rawTech = payloads[idx]?.ervTech?.trim();
    if (!rawTech || rawTech === row.scenario || rawTech.toLowerCase() === row.scenario.toLowerCase()) {
      return "";
    }
    return rawTech;
  };

  const getFullOptionName = (row: AnalysisRow) => {
    const tech = getTechName(row);
    return tech ? `${row.scenario} (${tech})` : row.scenario;
  };

  // Filter out options that perform WORSE than BaseCase (negative savings)
  const viableOptions = optionRows.filter(
    (r) => r.energySavingsPct !== null && r.energySavingsPct > 0,
  );

  const candidatePool = viableOptions.length > 0 ? viableOptions : optionRows;

  // Rank candidate options smartly:
  // 1. If payback is distinct (> 0.1 yrs difference and > 0.05), sort by payback ascending.
  // 2. If paybacks are equal / 0.0 yrs (e.g. $0 CapEx entered), sort by HIGHEST energy savings % (lowest MWh).
  const rankedOptions = [...candidatePool].sort((a, b) => {
    const pbA = a.simplePaybackYears ?? 999;
    const pbB = b.simplePaybackYears ?? 999;
    const diff = Math.abs(pbA - pbB);

    if (diff > 0.1 && pbA > 0.05 && pbB > 0.05) {
      return pbA - pbB;
    }

    // Tie-break or 0.0 payback: pick highest energy savings % (lowest MWh)
    const savA = a.energySavingsPct ?? -999;
    const savB = b.energySavingsPct ?? -999;
    return savB - savA;
  });

  const bestRow = rankedOptions[0];
  const bestTechName = getTechName(bestRow);
  const bestFullTitle = getFullOptionName(bestRow);

  const energySavingsPctStr = bestRow.energySavingsPct !== null && bestRow.energySavingsPct > 0
    ? `${(bestRow.energySavingsPct * 100).toFixed(1)}%`
    : "0%";

  const rawPayback = bestRow.simplePaybackYears;
  const isZeroCapEx = bestRow.capitalCostPremium === null || Math.abs(bestRow.capitalCostPremium) < 1;

  let paybackStr = "N/A";
  if (rawPayback !== null) {
    if (rawPayback <= 0.05 || isZeroCapEx) {
      paybackStr = "0.0 yrs (Immediate - Zero CapEx Premium)";
    } else if (rawPayback < 50) {
      paybackStr = `${rawPayback.toFixed(1)} yrs`;
    } else {
      paybackStr = "100+ yrs (no payback)";
    }
  }

  // Summary Text
  const baseCost = Math.round(baseRow.totalOperationalCost);
  const bestCostSaving = Math.round(bestRow.operationalCostSaving ?? 0);
  const baseMwh = baseRow.totalOaEnergyMwh.toFixed(1);
  const bestMwh = bestRow.totalOaEnergyMwh.toFixed(1);

  const summaryText = `Comparing ${optionRows.length} ERV simulation option${optionRows.length > 1 ? "s" : ""} against the BaseCase baseline (${baseMwh} MWh total energy, $${baseCost.toLocaleString("en-US")} annual operating cost): ${bestFullTitle} achieves the highest overall energy reduction and operational cost savings. It reduces total annual energy consumption to ${bestMwh} MWh, delivering a ${energySavingsPctStr} energy reduction and $${bestCostSaving.toLocaleString("en-US")}/yr in operational cost savings with a simple payback period of ${paybackStr}.`;

  // Stage Breakdown Insights
  const optionSummaries = optionRows
    .map((opt) => {
      const title = getFullOptionName(opt);
      const pb = opt.simplePaybackYears !== null
        ? opt.simplePaybackYears <= 0.05 || (opt.capitalCostPremium !== null && Math.abs(opt.capitalCostPremium) < 1)
          ? "0.0 yrs (Immediate)"
          : opt.simplePaybackYears < 50
          ? `${opt.simplePaybackYears.toFixed(1)} yrs`
          : "100+ yrs (no payback)"
        : "N/A";
      const mwh = opt.totalOaEnergyMwh.toFixed(1);
      const isInefficient = opt.energySavingsPct !== null && opt.energySavingsPct <= 0;
      return `${title}: ${mwh} MWh (${isInefficient ? "Higher than BaseCase" : pb})`;
    })
    .join("; ");

  const stageBreakdownText = `Analysis across options: ${optionSummaries}. Thermal heating and ventilation preheat constitute the primary energy loads in baseline operation. Implementing high-efficiency recovery technology significantly mitigates preheat thermal demand during peak winter operation.`;

  // Financial & Carbon Impact
  const co2Red = bestRow.co2ReductionPct !== null ? `${(bestRow.co2ReductionPct * 100).toFixed(1)}%` : "0%";
  const co2TonsSaved = (baseRow.totalCo2Tons - bestRow.totalCo2Tons).toFixed(1);
  const capPremiumText = isZeroCapEx
    ? "$0 (zero CapEx premium over conventional equipment)"
    : `$${Math.round(bestRow.capitalCostPremium ?? 0).toLocaleString("en-US")}`;

  const financialText = `For an initial incremental capital investment of ${capPremiumText}, ${bestFullTitle} generates $${bestCostSaving.toLocaleString("en-US")} in recurring annual utility savings while cutting carbon emissions by ${co2Red} (${co2TonsSaved} tons CO₂e avoided per year).`;

  // Recommendation Statement
  const recommendationText = `Recommendation: Proceed with ${bestFullTitle} to maximize thermal energy recovery, eliminate unnecessary utility expenditures, and achieve optimal facility lifecycle performance.`;

  return {
    headline: `Optimal ERV Selection: ${bestFullTitle}`,
    bestOptionLabel: bestRow.scenario,
    bestTechName,
    bestPaybackText: paybackStr,
    bestEnergySavingsPct: energySavingsPctStr,
    summaryText,
    stageBreakdownText,
    financialText,
    recommendationText,
  };
}
