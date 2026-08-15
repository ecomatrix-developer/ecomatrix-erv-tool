import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CalculateResult, ScenarioOutputs, AnalysisRow } from "@/lib/calc-engine/types";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import { generateAnalysisWriteup } from "@/lib/writeup-generator";

const BLUE: [number, number, number] = [30, 79, 216];
const SLATE: [number, number, number] = [71, 85, 105];
const SLATE_LIGHT: [number, number, number] = [148, 163, 184];
const EMERALD: [number, number, number] = [39, 171, 93];
const AMBER: [number, number, number] = [237, 137, 54];
const ROSE: [number, number, number] = [244, 63, 94];
const PREHEAT_INDIGO: [number, number, number] = [59, 82, 197];
const COOLING_PERIWINKLE: [number, number, number] = [127, 156, 245];

const SCENARIO_COLORS: [number, number, number][] = [
  [100, 116, 139], // BaseCase: slate
  BLUE,
  EMERALD,
  AMBER,
  ROSE,
];

interface ReportData {
  projectName: string;
  updatedAt: string;
  payloads: ScenarioInputsPayload[];
  result: CalculateResult;
}

const PAGE_W = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmt(n: number, digits = 1): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Draws a section heading with a small colored accent bar, returns the new y cursor. */
function sectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BLUE);
  doc.rect(MARGIN, y, 3, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title, MARGIN + 6, y + 4.2);
  return y + 10;
}

/** Horizontal grouped bar chart comparing one numeric metric across scenarios. */
function groupedBarChart(
  doc: jsPDF,
  y: number,
  height: number,
  scenarios: ScenarioOutputs[],
  values: number[],
  labelFn: (v: number) => string,
): number {
  const maxVal = Math.max(...values, 1e-9);
  const barH = Math.min(7, (height - 4) / scenarios.length - 2);
  const chartX = MARGIN + 36;
  const chartW = CONTENT_W - 36 - 28;
  let cy = y;

  scenarios.forEach((s, i) => {
    const val = values[i];
    const w = (val / maxVal) * chartW;
    const color = SCENARIO_COLORS[i % SCENARIO_COLORS.length];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(s.scenario, MARGIN, cy + barH / 2 + 1.2, { maxWidth: 34 });

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(chartX, cy, chartW, barH, 1, 1, "F");
    doc.setFillColor(...color);
    doc.roundedRect(chartX, cy, Math.max(w, 1.5), barH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(labelFn(val), chartX + chartW + 2, cy + barH / 2 + 1.2);

    cy += barH + 3;
  });

  return cy + 2;
}

/** Stacked bar chart matching Image 1: "Energy Use by End-Use, by Option" */
function stackedBarChart(doc: jsPDF, y: number, scenarios: ScenarioOutputs[]): number {
  const stageKeys: { key: keyof ScenarioOutputs; label: string; color: [number, number, number] }[] = [
    { key: "preheatEnergyMwh", label: "Preheat", color: PREHEAT_INDIGO },
    { key: "postHeatingEnergyMwh", label: "Post-heat", color: AMBER },
    { key: "coolingEnergyMwh", label: "Cooling", color: COOLING_PERIWINKLE },
    { key: "humidificationEnergyMwh", label: "Humidification", color: EMERALD },
  ];

  const maxTotal = Math.max(...scenarios.map((s) => s.totalEnergyMwh), 1e-9);
  const barH = 8;
  const chartX = MARGIN + 36;
  const chartW = CONTENT_W - 36 - 32;
  let cy = y;

  scenarios.forEach((s) => {
    let xOffset = chartX;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(s.scenario, MARGIN, cy + barH / 2 + 1.2, { maxWidth: 34 });

    stageKeys.forEach(({ key, color }) => {
      const val = s[key] as number;
      const w = (val / maxTotal) * chartW;
      if (w > 0.15) {
        doc.setFillColor(...color);
        doc.rect(xOffset, cy, w, barH, "F");
      }
      xOffset += w;
    });

    doc.setDrawColor(203, 213, 225);
    doc.rect(chartX, cy, chartW, barH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${Math.round(s.totalEnergyMwh)} MWh`, chartX + chartW + 2, cy + barH / 2 + 1.2);

    cy += barH + 4;
  });

  // Legend
  let lx = MARGIN + 36;
  doc.setFontSize(7);
  stageKeys.forEach(({ label, color }) => {
    doc.setFillColor(...color);
    doc.rect(lx, cy, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE);
    doc.text(label, lx + 4.5, cy + 2.6);
    lx += doc.getTextWidth(label) + 14;
  });

  return cy + 8;
}

/** Horizontal bar chart matching Image 2 & 3: "Simple Payback by Option" */
function paybackHorizontalBarChart(
  doc: jsPDF,
  y: number,
  analysisRows: AnalysisRow[],
  payloads: ScenarioInputsPayload[],
): number {
  const optionRows = analysisRows.slice(1);
  if (optionRows.length === 0) return y;

  const maxYears = 16;
  const barH = 7;
  const chartX = MARGIN + 38;
  const chartW = CONTENT_W - 38 - 36;
  let cy = y;

  optionRows.forEach((row, i) => {
    const payload = payloads[i + 1];
    const rawTech = payload?.ervTech?.trim();
    const techDisplay =
      rawTech && rawTech !== row.scenario && rawTech.toLowerCase() !== row.scenario.toLowerCase()
        ? rawTech
        : "";

    const rawPayback = row.simplePaybackYears;
    const isZeroCapEx = row.capitalCostPremium === null || Math.abs(row.capitalCostPremium) < 1;
    const isNoPayback = rawPayback === null || rawPayback > 15;

    let paybackVal = 15;
    let color: [number, number, number] = EMERALD;
    let labelText = "0.0 yrs (Immediate)";

    if (isNoPayback || (rawPayback && rawPayback > 8)) {
      paybackVal = 15;
      color = [229, 62, 62]; // Red
      labelText = "100+ yrs (no payback)";
    } else if (rawPayback && rawPayback > 0.05 && !isZeroCapEx) {
      paybackVal = Math.min(rawPayback, 15);
      color = rawPayback > 3.5 ? AMBER : EMERALD;
      labelText = `${rawPayback.toFixed(1)} yrs`;
    } else {
      paybackVal = 1.2; // Minimum bar width for zero CapEx / immediate payback
    }

    const w = (paybackVal / maxYears) * chartW;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    if (techDisplay) {
      doc.text(row.scenario, MARGIN, cy + 2.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE);
      doc.text(techDisplay, MARGIN, cy + 6.5, { maxWidth: 35 });
    } else {
      doc.text(row.scenario, MARGIN, cy + barH / 2 + 1.2, { maxWidth: 35 });
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(chartX, cy, chartW, barH, "F");
    doc.setFillColor(...color);
    doc.rect(chartX, cy, Math.max(w, 4), barH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(labelText, chartX + Math.max(w, 4) + 2, cy + barH / 2 + 1.2);

    cy += barH + 5;
  });

  // Draw X-axis line & tick marks (0, 2, 4, 6, 8, 10, 12, 14, 16)
  doc.setDrawColor(226, 232, 240);
  doc.line(chartX, cy, chartX + chartW, cy);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...SLATE);

  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  ticks.forEach((tick) => {
    const tx = chartX + (tick / maxYears) * chartW;
    doc.line(tx, cy, tx, cy + 1.5);
    doc.text(String(tick), tx, cy + 4.5, { align: "center" });
  });

  doc.text("Simple Payback (years)", chartX + chartW / 2, cy + 8.5, { align: "center" });

  return cy + 12;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 16) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function generateReportPdf(data: ReportData): void {
  const { projectName, updatedAt, payloads, result } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const bestOption =
    result.analysis
      .slice(1)
      .filter((r) => r.simplePaybackYears !== null)
      .sort((a, b) => (a.simplePaybackYears ?? Infinity) - (b.simplePaybackYears ?? Infinity))[0] ??
    result.analysis[1];
  const optionOne = result.analysis[1];

  // ---- Page 1: Header & Executive Highlights & Tables ----
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("ENERGY RECOVERY VENTILATION ANALYTICS REPORT", MARGIN, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("ECO Matrix Engineering Performance & Payback Assessment", MARGIN, 18);

  doc.setFontSize(8);
  doc.text(`Project: ${projectName}`, PAGE_W - MARGIN, 10, { align: "right" });
  doc.text(
    `Date: ${new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    PAGE_W - MARGIN,
    15,
    { align: "right" },
  );
  doc.text(`Location: ${payloads[0]?.city ?? "—"}`, PAGE_W - MARGIN, 20, { align: "right" });

  let y = 34;

  // ---- Executive highlights ----
  if (optionOne) {
    y = sectionHeading(doc, "Executive Performance Highlights", y);
    const cardW = (CONTENT_W - 8) / 3;
    const cards: { label: string; value: string; sub: string; color: [number, number, number] }[] = [
      {
        label: "MAX ENERGY REDUCTION",
        value: `${((optionOne.energySavingsPct ?? 0) * 100).toFixed(1)}%`,
        sub: "vs BaseCase Conventional HVAC",
        color: BLUE,
      },
      {
        label: "OPERATIONAL SAVINGS",
        value: money(optionOne.operationalCostSaving ?? 0),
        sub: "Annual cost reduction ($/yr)",
        color: EMERALD,
      },
      {
        label: "SIMPLE PAYBACK",
        value: bestOption?.simplePaybackYears ? `${bestOption.simplePaybackYears.toFixed(1)} Yrs` : "—",
        sub: "Return on capital investment",
        color: [147, 51, 234],
      },
    ];
    cards.forEach((c, i) => {
      const x = MARGIN + i * (cardW + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, cardW, 22, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...c.color);
      doc.text(c.label, x + 4, y + 6);
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(c.value, x + 4, y + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...SLATE);
      doc.text(c.sub, x + 4, y + 19, { maxWidth: cardW - 8 });
    });
    y += 28;
  }

  // ---- Detailed stage calculation table ----
  y = ensureSpace(doc, y, 30);
  y = sectionHeading(doc, "Detailed Stage Calculation Outputs", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 1.8 },
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold" } },
    head: [["Scenario", "ERV Tech", "Preheat", "Post-Heat", "Post-Cool", "Humid.", "Total (MWh)", "Op. Cost"]],
    body: result.scenarios.map((s, i) => [
      s.scenario,
      payloads[i]?.ervTech || "—",
      fmt(s.preheatEnergyMwh),
      fmt(s.postHeatingEnergyMwh),
      fmt(s.coolingEnergyMwh),
      fmt(s.humidificationEnergyMwh),
      fmt(s.totalEnergyMwh),
      money(s.totalOperationalCost),
    ]),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- Financial ROI & environmental summary table ----
  y = ensureSpace(doc, y, 30);
  y = sectionHeading(doc, "Financial ROI & Environmental Summary", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 1.8 },
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold" } },
    head: [["Scenario", "Energy Savings", "Annual Op. Savings", "Capital Premium", "Payback (Yrs)", "CO2 Reduction"]],
    body: result.analysis.map((row) => [
      row.scenario,
      row.energySavingsPct === null ? "BaseCase" : `${(row.energySavingsPct * 100).toFixed(1)}%`,
      row.operationalCostSaving === null ? "—" : money(row.operationalCostSaving),
      row.capitalCostPremium === null ? "—" : money(row.capitalCostPremium),
      row.simplePaybackYears === null ? "—" : `${row.simplePaybackYears.toFixed(1)}`,
      row.co2ReductionPct === null ? "—" : `${(row.co2ReductionPct * 100).toFixed(1)}%`,
    ]),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ---- Page 2: Modeled Input Configuration & Initial Summaries ----
  y = ensureSpace(doc, y, 24);
  y = sectionHeading(doc, "Modeled Input Configuration", y);
  const base = payloads[0];
  const configRows = [
    ["Supply Airflow", `${base?.supplyFlow ?? 0} L/s`],
    ["Exhaust Airflow", `${base?.exhaustFlow ?? 0} L/s`],
    ["Preheat Threshold", `${base?.preheatTemp ?? 0} °C`],
    ["Electricity Tariff", `$${base?.fuelCostElectricity ?? 0}/kWh`],
  ];
  let cx = MARGIN;
  configRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE);
    doc.text(label, cx, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(value, cx, y + 5);
    cx += CONTENT_W / 4;
  });
  y += 16;

  // ---- PAGE 3: DEDICATED VISUAL CHARTS & AUTOGENERATED WRITEUP ----
  doc.addPage();
  y = MARGIN;

  // Page 3 Header
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PAGE_W, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("PAGE 3: EXECUTIVE ANALYTICS WRITEUP & COMPARATIVE CHARTS", MARGIN, 11);

  y = 24;

  // Autogenerated Writeup Box
  const writeup = generateAnalysisWriteup(result.analysis, result.scenarios, payloads);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(MARGIN, y, CONTENT_W, 42, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLUE);
  doc.text(`Autogenerated Narrative: ${writeup.headline}`, MARGIN + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);

  const splitSummary = doc.splitTextToSize(writeup.summaryText, CONTENT_W - 8);
  doc.text(splitSummary, MARGIN + 4, y + 11);

  let wy = y + 11 + splitSummary.length * 3.2;
  const splitBreakdown = doc.splitTextToSize(writeup.stageBreakdownText, CONTENT_W - 8);
  doc.text(splitBreakdown, MARGIN + 4, wy);

  wy += splitBreakdown.length * 3.2;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 128, 64);
  const splitRec = doc.splitTextToSize(writeup.recommendationText, CONTENT_W - 8);
  doc.text(splitRec, MARGIN + 4, wy);

  y += 48;

  // Chart 1: Energy Use by End-Use, by Option (Stacked Bar Chart)
  y = sectionHeading(doc, "1. Energy Use by End-Use, by Option (MWh)", y);
  y = stackedBarChart(doc, y, result.scenarios);
  y += 6;

  // Chart 2: Simple Payback by Option (Horizontal Bar Chart matching screenshot)
  if (result.analysis.length > 1) {
    y = sectionHeading(doc, "2. Simple Payback by Option (Years)", y);
    y = paybackHorizontalBarChart(doc, y, result.analysis, payloads);
    y += 6;
  }

  // Chart 3: Annual Operational Cost by Option ($)
  y = sectionHeading(doc, "3. Annual Operational Cost by Option ($/yr)", y);
  y = groupedBarChart(
    doc,
    y,
    result.scenarios.length * 9,
    result.scenarios,
    result.scenarios.map((s) => s.totalOperationalCost),
    (v) => money(v),
  );

  // ---- Footer on every page ----
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, pageH - 12, PAGE_W - MARGIN, pageH - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE_LIGHT);
    doc.text("ECO Matrix ERV Performance Engine · Official Analytics Report", MARGIN, pageH - 7);
    doc.text(
      `© ${new Date().getFullYear()} ECO Matrix Solutions · Page ${p} of ${pageCount}`,
      PAGE_W - MARGIN,
      pageH - 7,
      { align: "right" },
    );
  }

  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_") || "ERV_Project";
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`${safeName}_Report_${dateStr}.pdf`);
}
