# ERV Tool Formula Catalog

Source workbook: `ERV Tool_June 2025_AG.xlsx`, sheet `Fresh air Sys 1-default_R2`.
Scope analyzed: rows 1-398, all columns A through NK (column NK = last used column,
375 total). Rows 399-9161 are pure static weather data (not covered here).

Method: every formula cell in A1:NK398 (106,831 formula cells total) was extracted with
openpyxl, then normalized by replacing cell references' row digits and column letters
with placeholders (row-relative and column-relative references normalized separately,
`$` anchors preserved) so that e.g. `D46` and `D47`, or `K100` and `L100`, collapse to
the same template. This produced **33 distinct normalized formula templates**.

## Key structural finding: the "AV-NK" column block

Initial sampling suggested columns beyond AU might be a separate, unexplained repeating
structure. Full extraction resolved this:

- **Columns K through NK (365 columns)** are one column per calendar day of the year
  (row 32/34 shows `2018-01-01`, `2018-01-02`, ... `2018-12-31` — a fixed 2018 calendar
  used purely to walk 365 day-columns; the year itself is not meaningful).
- **Rows 35-58, 59-82, 83-106, ...** (blocks of 24 rows) are the 24 hours of each day
  (column C carries the time-of-day label `01:00:00` ... `24:00:00`, i.e. `ROW()-33`
  is the hour-of-year index into the HLOOKUP weather table).
- So the grid **K35:NK58 stacked over all day-blocks down to row 398** is an
  8,760-hour-of-year x (variable calc rows) matrix: 365 day-columns wide, 24-hour-tall
  blocks repeated down for each computed quantity (dry-bulb temp, RH, psychrometrics,
  preheat/postheat/cooling/humidification energy, day-of-week/scenario-selection
  flags, etc.). Column D (and the early K:Q columns near row 33-59) is simply the
  first realized day/week; K:NK is that same per-hour calculation replicated
  (via HLOOKUP-independent, purely arithmetic formulas referencing the row directly
  above/below) across all 365 days — **not** a separate monthly rollup. There is no
  additional undiscovered section; it is the hourly engine's full-year expansion.
- The actual **monthly rollup** lives in rows 15-26, columns D-G, which `SUMIF` large
  day-column ranges (e.g. `$K$250:$AO$273` = Jan block spanning ~31 day-columns) against
  a scenario-selector cell `$M$21` to total each month's energy by category.
- The **per-scenario summary/comparison block** is columns Y-AU, rows 4-10 (headers in
  row 4, data rows 5-9 = Option 1-4/5, row 10 labeled "Option 5"), and a second
  **final analysis block** in rows 13-26 / columns Y-AI (row 13 sub-headers, row 14 =
  BaseCase, rows 15-18 = Options 1-4, then rows 22-26 = a mirrored comparison table
  where row 22 is the BaseCase reference and rows 23-26 compute deltas/percentages
  against it).
- Rows 22-30, columns AB/AD/AF/AH/AI **are populated** — but only from row 23 onward.
  Row 22 is the BaseCase reference row itself, so its % Energy Savings, % CO2
  reduction, Capital Cost Premium, Operational Cost saving, and Simple Payback columns
  are intentionally blank (nothing to compare BaseCase against itself). This is normal
  spreadsheet design, not a missing write-back step. Rows 27-30 in that block are
  fully empty (no formulas) — the comparison table only has 5 data rows (22 + 23-26,
  matching BaseCase + Options 1-4).

## Row/column map used below

- **Config scalars**: rows 1-18 (labels in col A, values in col B-R area), e.g.
  `$A$2`/`$A$3`/`$A$4` = preheat/postheat/cooling YES-NO toggles, `$C$2`/`$C$3`/`$C$4`
  = setpoints, `$G$3`/`$G$4`/`$H$3`/`$H$4` = effectiveness factors, `$J$3`/`$J$4` =
  supply/exhaust flow, `$N$3`/`$O$3`/`$P$3`/`$Q$3` = COPs, `$K$3`/`$L$3` = specific
  heat x flow constant used repeatedly in energy formulas, `$B$8`/`$B$9` = electricity
  /gas $/kWh, `$B$12`/`$B$13` = electricity/gas GHG factors, `$A$16`/`$A$17`/`$A$18`
  = fuel source selectors (Natural Gas / Electricity) for preheat/postheat/humidification.
- **Monthly rollup**: rows 15-28, columns C-G (+ SUMIF into the day/hour grid).
- **Scenario input/output block**: rows 4-10, columns Y-AU (5 scenario rows,
  BaseCase + Options 1-4/5).
- **Final comparison block**: rows 13-26, columns Y-AI (row 22 = baseline, 23-26 =
  deltas vs baseline).
- **Hourly engine**: rows 34-398 (365 days x 24-hour blocks), columns D (first/reference
  day) mirrored across K:NK (365 day-columns), computing dry-bulb temp (HLOOKUP),
  RH (HLOOKUP), saturation vapor pressure, humidity ratio, preheat/postheat/cooling
  energy, and enthalpy-recovery temperature blending.

---

## 1. Config passthroughs (scenario block inputs, rows 5-10)

### T1 — Scalar input passthrough (single-scenario column)
- **Template**: `=$C$R` (absolute row+col reference, no arithmetic)
- **Section**: Scenario summary header, rows 5-10, columns Y-AM
- **Count**: 8,859 occurrences (dominant single template — most cells in the
  scenario-info columns just mirror a config cell)
- **What it computes**: Pass-through of a single config scalar into the scenario
  comparison table (e.g. setpoint, effectiveness %, flow, COP, fuel-source selector).
- **Verbatim example**: `Y5=$F$2`, `AA5=$C$2`, `AB5=$G$3`, `AG5=$N$3`, `AK5=$A$16`
- **Depends on**: whichever single config cell is being mirrored (`$F$2`, `$C$2`,
  `$G$3`, `$G$4`, `$H$3`, `$J$3`, `$J$4`, `$N$3`, `$O$3`, `$P$3`, `$Q$3`, `$A$16`,
  `$A$17`, `$A$18`, etc.)

### T2 — Relative-row scalar mirror
- **Template**: `=CR` (unanchored reference, same column, row-shifted)
- **Section**: Appears everywhere but most notably rows 22-26 mirroring rows 14-18
  (`Y22=Y14`, `Z22=Z14`) and row 33→row-above mirrors in the hourly engine spillover.
- **Count**: 17,597 occurrences (2nd most common template overall — largely the
  hourly-engine's own-column chaining, see T14 below, plus the Y:Z scenario-name
  mirrors)
- **What it computes**: Direct copy of a value one or more rows away in the same
  column — used both for scenario name/tech mirrors (`Y22=Y14`) and the internal
  hourly chaining `K33=D35`, `K34=D36`, etc.
- **Verbatim example**: `Y22=Y14`, `Z22=Z14`, `AD10=H3`
- **Depends on**: the source row directly (row-shifted only, column fixed)

### T3 — Anchored column mirror (unanchored row)
- **Template**: `=$CR` (column absolute, row relative)
- **Section**: Hourly engine and monthly table, e.g. row 168 mirroring column K/L/M
  from itself.
- **Count**: 17,328 occurrences
- **What it computes**: Copies a value from a fixed column but a shifting row — used
  heavily in the hourly engine's per-hour chaining down a day-column.
- **Verbatim example**: `L168=$K168`, `M168=$K168`
- **Depends on**: the anchored column of the same row block

---

## 2. Psychrometric / hourly engine core (rows 34-58 template, replicated to row 398 and across K:NK)

### T4 — Weather data HLOOKUP (dry-bulb temp / RH pull)
- **Template**: `=HLOOKUP($C$R,$C$R:$C$R,ROW()-33,FALSE)`
- **Section**: Hourly engine, rows 36-398, columns D and E (reference day columns)
- **Count**: 726 occurrences
- **What it computes**: Pulls the dry-bulb temperature (col D) or relative humidity
  (col E) for the current hour-of-year from the static weather table below row 398,
  using `ROW()-33` as the hour index and `$D$34` as the selected city/location key.
- **Verbatim example**: `D36=HLOOKUP($D$34,$O$401:$DI$9161,ROW()-33,FALSE)`,
  `E36=HLOOKUP($D$34,$DL$401:$HF$9161,ROW()-33,FALSE)`
- **Depends on**: `$D$34` (location selector), weather block `$O$401:$DI$9161`
  (dry-bulb) / `$DL$401:$HF$9161` (RH)

### T5 — Saturation vapor pressure (psychrometric)
- **Template**: `=IF(CR<0,(0.61115*EXP((23.036-CR/333.7)*(CR/(279.82+CR)))),(0.61121*EXP((18.678-CR/234.5)*(CR/(257.14+CR)))))`
- **Section**: Hourly engine, column F, rows 35-398
- **Count**: 364
- **What it computes**: Saturation vapor pressure (kPa) from dry-bulb temp, using the
  ASHRAE/Sonntag-style piecewise formula (ice-bulb branch below 0degC, water-bulb
  branch otherwise).
- **Verbatim example**: `F35=IF(D35<0,(0.61115*EXP((23.036-D35/333.7)*(D35/(279.82+D35)))),(0.61121*EXP((18.678-D35/234.5)*(D35/(257.14+D35)))))`
- **Depends on**: dry-bulb temp in column D of the same row

### T6 — Humidity ratio
- **Template**: `=(0.622*CR/100*CR)/(101.325-CR/100*CR)`
- **Section**: Hourly engine, column G, rows 35-398
- **Count**: 364
- **What it computes**: Humidity ratio (kg water/kg dry air) from saturation vapor
  pressure (col F) and RH% (col E), standard atmospheric pressure 101.325 kPa assumed.
- **Verbatim example**: `G35=(0.622*F35/100*E35)/(101.325-F35/100*E35)`
- **Depends on**: `F{row}` (sat. vapor pressure), `E{row}` (RH%)

### T7 — Humidity ratio via inline saturation-pressure recompute (design/other setpoints)
- **Template**: `=(0.622*(0.61121*EXP((18.678-CR/234.5)*(CR/(257.14+CR))))*$C$R)/(101.325-$C$R*(0.61121*EXP((18.678-CR/234.5)*(CR/(257.14+CR)))))`
- **Section**: Config block, rows 3-4, column F (design condition humidity ratios,
  not the hourly loop)
- **Count**: 2
- **What it computes**: Same humidity-ratio math as T6 but recomputed inline for a
  fixed design temperature/RH pair (winter/summer setpoint), rather than referencing
  a separate saturation-pressure cell.
- **Verbatim example**: `F3=(0.622*(0.61121*EXP((18.678-C3/234.5)*(C3/(257.14+C3))))*$E$3)/(101.325-$E$3*(0.61121*EXP((18.678-C3/234.5)*(C3/(257.14+C3)))))`
- **Depends on**: `C{row}` (design temp), `$E$3`/`$E$4` (design RH)

### T8 — Preheat energy (below pre-heat setpoint)
- **Template**: `=IF(CR<$C$R,$C$R*$C$R*($C$R-CR),0)`
- **Section**: Hourly engine, column E/F area rows 11-12 template (early reference
  rows before the IF-toggle version takes over at row 33+)
- **Count**: 17,521 (largest single hourly-engine template — replicated across all
  365 day-columns x 8760 hours for this calc shape family)
- **What it computes**: Sensible preheat energy = flow*specific-heat constant *
  (setpoint - outdoor temp), only when outdoor temp is below the pre-heat setpoint,
  else 0. `$K$3*$L$3` is the mass-flow x specific-heat constant.
- **Verbatim example**: `E12=IF(E11<$C$3,$K$3*$L$3*($C$3-E11),0)`
- **Depends on**: outdoor/entering temp `{col}{row-1}`, `$C$3` (pre-heat setpoint),
  `$K$3`, `$L$3` (flow x specific heat constant)

### T9 — Cooling energy (above post-ERV cooling setpoint)
- **Template**: `=IF(CR>$C$R,$C$R*$C$R*(CR-$C$R),0)`
- **Section**: Hourly engine, same row family as T8
- **Count**: 8,761
- **What it computes**: Sensible cooling energy = flow*specific-heat constant *
  (entering temp - cooling setpoint), only when above setpoint, else 0.
- **Verbatim example**: `F12=IF(F11>$C$4,$K$3*$L$3*(F11-$C$4),0)`
- **Depends on**: entering temp `{col}{row-1}`, `$C$4` (cooling setpoint), `$K$3`,
  `$L$3`

### T10 — Preheat energy, toggle-gated (main hourly-engine copy, K:NK grid)
- **Template**: `=IF($C$R="NO",0,IF($C$R>CR,$C$R*$C$R*($C$R-CR),0))`
- **Section**: Hourly engine, rows 87-110-ish family, columns K:NK (365-day grid)
- **Count**: 8,760 (= 365 days x 24 hrs)
- **What it computes**: Same preheat energy as T8, but gated by the `$A$2` = "YES"/"NO"
  preheat-enable toggle — if preheat is disabled the whole column returns 0.
- **Verbatim example**: `K87=IF($A$2="NO",0,IF($C$2>K33,$K$3*$L$3*($C$2-K33),0))`
- **Depends on**: `$A$2` (preheat enable toggle), `$C$2` (setpoint), entering temp
  `{col}33`-family row, `$K$3`, `$L$3`

### T11 — Day-of-week / scenario match flag (AND-based selector)
- **Template**: `=AND(CR=$C$R,CR=$C$R,CR,$C$R)`
- **Section**: Hourly engine, rows 250-273 family (used as the SUMIF criteria range
  for monthly rollups)
- **Count**: 8,760
- **What it computes**: A boolean flag per hour testing whether that hour's date/
  scenario markers match the currently selected scenario (`$M$21`) — feeds the
  `SUMIF($K$250:$AO$273,$M$21,...)` monthly rollups (T24 below) as the criteria range.
- **Verbatim example**: `K250=AND(K168=$M$21,K195=$M$21,K223,$M$21)`
- **Depends on**: `{col}168`, `{col}195`, `{col}223` (intermediate per-hour markers),
  `$M$21` (selected scenario key)

### T12 — Effectiveness-blended supply air temperature (single-branch, no toggle)
- **Template**: `=IF(CR>$C$R,CR+($C$R*($C$R-CR)*($C$R/$C$R)),IF(CR<$C$R,CR+($C$R*($C$R-CR)*($C$R/$C$R)),IF(AND(CR>=$C$R,CR<=$C$R),CR,IF(CR>$C$R,CR+($C$R*($C$R-CR)*($C$R/$C$R)),""))))`
- **Section**: Hourly engine, rows 277-304 family (post-ERV supply temp before
  post-heat/cooling coil)
- **Count**: 8,760
- **What it computes**: Applies the winter/summer sensible-effectiveness blend to
  outdoor air temperature to get ERV-leaving supply air temp, without the preheat
  YES/NO branch (used downstream of preheat, i.e. this models the ERV's sensible
  recovery effect itself): below summer-setpoint uses winter effectiveness blend,
  above winter-setpoint (but per the nested IF logic, mislabeled continuation) uses
  summer effectiveness, in-band passes through unchanged.
- **Verbatim example**: `K304=IF(K277>$F$4,K277+($H$4*($F$4-K277)*($J$4/$J$3)),IF(K277<$F$3,K277+($H$3*($F$3-K277)*($J$4/$J$3)),IF(AND(K277>=$F$3,K277<=$F$4),K277,IF(K277>$F$4,K277+($H$4*($F$4-K277)*($J$4/$J$3)),""))))`
- **Depends on**: `{col}277` (entering/outdoor temp for this stage), `$F$3`/`$F$4`
  (band setpoints), `$H$3`/`$H$4` (effectiveness), `$J$3`/`$J$4` (flow ratio)

### T13 — Effectiveness-blended supply air temperature, preheat-toggle-gated (main copy)
- **Template**: multi-line nested-IF, toggled by `$C$R="YES"` first (`$A$2`), otherwise
  falls through to the untoggled blend logic (same shape as T12 nested inside).
- **Section**: Hourly engine, rows 60-83 family (K:NK grid) — this is the primary,
  toggle-aware version of the ERV sensible-effectiveness blend feeding preheat.
- **Count**: 8,712 (plus 48 more as a whitespace-formatted variant — see below)
- **What it computes**: If preheat is enabled (`$A$2`="YES"), clamps outdoor air to
  at least the pre-heat setpoint blended by winter effectiveness before applying the
  same effectiveness-blend logic as T12; if disabled, applies the blend directly to
  raw outdoor air.
- **Verbatim example** (row 60, col L):
  ```
  =IF($A$2="YES",
  IF(L33<$C$2,
  $C$2+($G$3*($C$3-$C$2)*($J$4/$J$3)),
  IF(AND(L33>=$C$2,L33<=$C$3),
  L33+($G$3*($C$3-L33)*($J$4/$J$3)),
  IF(AND(L33>$C$3,L33<=$C$4),
  L33,
  IF(L33>$C$4,
  L33+($G$4*($C$4-L33)*($J$4/$J$3)),
  ""
  )
  )
  )
  ),
  IF(L33<$C$3,
  L33+($G$3*($C$3-L33)*($J$4/$J$3)),
  IF(AND(L33>=$C$3,L33<=$C$4),
  L33,
  IF(L33>$C$4,
  L33+($G$4*($C$4-L33)*($J$4/$J$3)),
  ""
  )
  )
  )
  )
  ```
- **Depends on**: `$A$2` (preheat toggle), `$C$2`/`$C$3`/`$C$4` (setpoints), `$G$3`/
  `$G$4` (effectiveness), `$J$3`/`$J$4` (flow ratio), `{col}33` (prior-stage temp)
- **Note**: A byte-for-byte duplicate of this template exists 48 times with different
  internal whitespace/indentation only (same logic, reformatted) — normalized to the
  same template, confirmed not a logic difference; example at `K60` vs `JF60`.

### T14 — Hourly chain-forward mirror (own column, next day-block row)
- **Template**: `=CR` (already counted under T2; the D-column chain `D35=D36`,
  `D36=HLOOKUP(...)` etc. and the reference-column `K33=D35` chain both normalize here)
- **Section**: Hourly engine day-to-day linkage, column D and column K (reference
  day-of-week template row 33)
- **Verbatim example**: `K33=D35`, `K34=D36` (feeds the K:NK grid's row-33 "template
  row" from the first realized day's D-column values)

---

## 3. Monthly rollup (rows 15-28, columns C-G)

### T15 — Monthly SUMIF rollup by scenario selector
- **Template**: `=SUMIF($C$R:$C$R,$C$R,$C$R:$C$R)/1000`
- **Section**: Monthly summary table, rows 15-26, columns D-G
- **Count**: 48 (12 months x 4 energy categories)
- **What it computes**: Sums a given month's hourly energy values (preheat/postheat/
  cooling/humidification) across all matching day-columns for that month, filtered by
  the day-of-week/scenario-match flag (T11) equal to the selected scenario key `$M$21`,
  converted Wh->kWh (`/1000`).
- **Verbatim example**: `D15=SUMIF($K$250:$AO$273,$M$21,$K$87:$AO$110)/1000` (January,
  preheat energy), `D20=SUMIF($FF$250:$GI$273,$M$21,$FF$87:$GI$110)/1000` (June)
- **Depends on**: `$M$21` (scenario selector), the month's day-column span in the
  flag rows (250-273) and matching energy rows (87-110 preheat, 114-137 post-heat,
  141-164 cooling, 331-354 humidification)

### T16 — Annual summation without COP adjustment
- **Template**: `=SUM(CR:CR)`
- **Section**: Row 27 ("Summation without COP"), columns D-G; also row 5-9's `AR`
  column (Total Energy)
- **Count**: 10
- **What it computes**: Sums the 12 monthly values (rows 15-26) into an annual total
  per energy category; separately, `AR{row}=SUM(AN{row}:AQ{row})` sums the four
  scenario energy categories (preheat/postheat/cooling/humidification) into total
  energy for that scenario.
- **Verbatim example**: `D27=SUM(D15:D26)`, `AR5=SUM(AN5:AQ5)`

### T17 — Annual summation with COP adjustment (electricity/gas efficiency correction)
- **Template**: `=SUM(CR:CR)/CR`
- **Section**: Row 28 ("Summation with COP"), columns D-F
- **Count**: 3
- **What it computes**: Divides the annual raw energy total by the relevant COP to
  get delivered/input energy accounting for equipment efficiency.
- **Verbatim example**: `D28=SUM(D15:D26)/N3` (preheat / preheat COP), `E28=SUM(E15:E26)/O3`,
  `F28=SUM(F15:F26)/P3`

### T18 — Annual summation with COP, humidification-toggle-gated
- **Template**: `=IF(CR="YES",SUM(CR:CR)/CR,0)`
- **Section**: Row 28, column G (humidification)
- **Count**: 1
- **What it computes**: Same as T17 but zero if humidification is disabled
  (`$D$2`="YES" check, distinct because humidification has its own on/off toggle).
- **Verbatim example**: `G28=IF(D2="YES",SUM(G15:G26)/Q3,0)`

---

## 4. Scenario summary block (rows 5-10, columns AN-AU)

### T19 — Total operational cost, fuel-source-conditional (per scenario)
- **Template**: `=ROUND(IF(CR=$C$R,CR*$C$R*1000,CR*$C$R*1000)+IF(CR=$C$R,CR*$C$R*1000,CR*$C$R*1000)+CR*$C$R*1000+IF(CR=$C$R,CR*$C$R*1000,CR*$C$R*1000),0)`
- **Section**: Scenario summary, column AS, rows 5-9
- **Count**: 5 (rounded, `$` absolute) + 2 duplicates without `$` anchors (rows 2/10 —
  see anomaly note below)
- **What it computes**: Total annual operational cost for the scenario: for each of
  preheat/post-heat/humidification energy, picks the electric ($/kWh `$B$8`) or gas
  ($/kWh `$B$9`) rate depending on that scenario's fuel-source selector
  (`AK`=preheat, `AL`=postheat, `AM`=humidification, matched against `$A$16`/`$A$17`/
  `$A$18`), plus cooling energy always billed at electricity rate (`AP*$B$8`), all
  x1000 (MWh->kWh) and rounded to whole dollars.
- **Verbatim example**: `AS5=ROUND(IF(AK5=$A$16,AN5*$B$8*1000,AN5*$B$9*1000)+IF(AL5=$A$17,AO5*$B$8*1000,AO5*$B$9*1000)+AP5*$B$8*1000+IF(AM5=$A$18,AQ5*$B$8*1000,AQ5*$B$9*1000),0)`
- **Depends on**: `AK/AL/AM{row}` (fuel selectors), `$A$16`/`$A$17`/`$A$18` (config
  fuel choice), `AN/AO/AP/AQ{row}` (per-category MWh energy), `$B$8`/`$B$9`
  (elec/gas $/kWh)

### T20 — Total GHG (CO2), fuel-source-conditional (per scenario)
- **Template**: `=IF(CR=$C$R,CR*$C$R,CR*$C$R)+IF(CR=$C$R,CR*$C$R,CR*$C$R)+CR*$C$R+IF(CR=$C$R,CR*$C$R,CR*$C$R)`
- **Section**: Scenario summary, column AU, rows 5-9
- **Count**: 5 (`$`-anchored) + 1 duplicate without anchors (row 10 anomaly)
- **What it computes**: Same fuel-source-conditional structure as T19 but for GHG
  (tons CO2), using `$B$12`/`$B$13` (electricity/gas kg-CO2/kWh factors) instead of
  cost rates, and without the x1000/ROUND (units already tons via the GHG factor
  convention).
- **Verbatim example**: `AU5=IF(AK5=$A$16,AN5*$B$12,AN5*$B$13)+IF(AL5=$A$17,AO5*$B$12,AO5*$B$13)+AP5*$B$12+IF(AM5=$A$18,AQ5*$B$12,AQ5*$B$13)`
- **Depends on**: same fuel selectors as T19, `$B$12`/`$B$13` (GHG factors)

### T21 — Capital cost total (per scenario)
- **Template**: `=$C$R+$C$R+$C$R+$C$R+$C$R`
- **Section**: Scenario summary, column AT, rows 5-9
- **Count**: 5
- **What it computes**: Sums five fixed capital-cost line items (equipment cost
  components) into a total capital cost — note this is identical across all 5
  scenario rows (same absolute cells `$AM$3:$AQ$3`), which is likely a workbook
  simplification/placeholder (see anomaly note below).
- **Verbatim example**: `AT5=$AM$3+$AN$3+$AO$3+$AP$3+$AQ$3`

### T22 — Capital cost total via SUM (single occurrence variant of T21)
- **Template**: `=SUM($C$R:$C$R)`
- **Section**: Scenario summary, column AT, row 10 only
- **Count**: 1
- **What it computes**: Same capital-cost total as T21, expressed as a SUM range
  instead of explicit addition — a formatting inconsistency, not a logic difference.
- **Verbatim example**: `AT10=SUM($AM$3:$AP$3)` (note: only 4 terms, `AM:AP`, missing
  `AQ3` compared to T21's 5-term version — see anomaly note)

### T23 — Scenario energy subtotal without humidification (row 5, column AW; orphaned)
- **Template**: `=CR+CR+CR+CR`
- **Section**: Column AW, row 5 only
- **Count**: 1
- **What it computes**: `AO5+AN5+AP5+AQ5` — sums post-heat + preheat + cooling +
  humidification energy again (same four terms as `AR5`'s `SUM(AN5:AQ5)`, just
  reordered and spelled out). Appears to be a leftover/duplicate check cell rather
  than a formula the rest of the model depends on — no other cell references `AW5`.

---

## 5. Final comparison / analysis block (rows 13-26, columns Y-AI)

### T24 — Baseline reference passthrough (row 22 from row 14)
- Uses **T2** (`=CR`, e.g. `Y22=Y14`, `Z22=Z14`) and **T1**-style absolute copies
  (`AA22=AR14`, `AC22=AU14`, `AE22=AT14`, `AG22=AS14`) to pull the BaseCase scenario's
  name, tech, total energy, total CO2, capital cost, and operational cost down into
  the row-22 baseline row of the comparison table.

### T25 — Energy savings % (vs baseline)
- **Template**: `=1-CR/C$R`
- **Section**: Column AB (and AD, same template), rows 23-26
- **Count**: 8 (4 rows x 2 columns: AB energy%, AD CO2%)
- **What it computes**: `1 - (this option's total / baseline total)` = percentage
  reduction versus BaseCase, for both energy (AB, using AA) and CO2 (AD, using AC).
- **Verbatim example**: `AB23=1-AA23/AA$22` (Energy Savings %), `AD23=1-AC23/AC$22`
  (% CO2 reduction)
- **Depends on**: `AA{row}`/`AA$22` or `AC{row}`/`AC$22`

### T26 — Capital cost premium (vs baseline)
- **Template**: `=CR-C$R`
- **Section**: Column AF, rows 23-26
- **Count**: 4
- **What it computes**: This option's capital cost minus BaseCase capital cost
  (positive = more expensive than baseline).
- **Verbatim example**: `AF23=AE23-AE$22`

### T27 — Operational cost saving (vs baseline)
- **Template**: `=$C$R-CR`
- **Section**: Column AH, rows 23-26
- **Count**: 4
- **What it computes**: BaseCase operational cost minus this option's operational
  cost (positive = savings versus baseline).
- **Verbatim example**: `AH23=$AG$22-AG23`

### T28 — Simple payback (years), clamped 0-100
- **Template**: `=ROUND(IF(CR=0,0,IF(AND(CR>0,CR<=0),100,IF(AND(CR<0,CR>=0),0,IF(AND(CR/CR>100,CR>0,CR>0),100,IF(AND(CR>0,CR>0),CR/CR,IF(AND(CR<0,CR<0),0,0)))))),2)`
- **Section**: Column AI, rows 23-26
- **Count**: 4
- **What it computes**: Capital cost premium (AF) divided by operational cost saving
  (AH), i.e. years to pay back the extra capital cost via operating savings, with
  guard clauses: 0 if no premium, 100 (capped) if premium exists but no savings or the
  ratio exceeds 100, 0 if premium is negative and there's a cost increase (both
  negative), otherwise the straight ratio, rounded to 2 decimals.
- **Verbatim example**: `AI23=ROUND(IF(AF23=0,0,IF(AND(AF23>0,AH23<=0),100,IF(AND(AF23<0,AH23>=0),0,IF(AND(AF23/AH23>100,AF23>0,AH23>0),100,IF(AND(AF23>0,AH23>0),AF23/AH23,IF(AND(AF23<0,AH23<0),0,0)))))),2)`
- **Depends on**: `AF{row}` (capital premium), `AH{row}` (operational savings)
- **Note**: Row 22 (BaseCase) intentionally has no formulas in AB/AD/AF/AH/AI — it is
  the reference row being compared against, not a missing write-back. Rows 27-30 in
  this block have no formulas at all (table is fixed at 5 rows: 22 + 23-26).

---

## 6. Miscellaneous / low-count templates (config area, rows 3-11)

### T29 — Row-label static day-of-week mirror
- **Template**: `=C$R`
- **Section**: Row 196 area (e.g. `K196=K$195`) and similar single-row-shift mirrors
  within the hourly engine's day-of-week template rows.
- **Count**: 161
- **What it computes**: Copies the value directly above (fixed column, row minus 1,
  row-anchored) — used for chaining the day-of-week/scenario template rows down into
  the day-column grid.
- **Verbatim example**: `K196=K$195`

### T30 — GHG factor derived from cost (unexplained-looking but resolves to design calc)
- **Template**: `=CR*0.0012`
- **Section**: Rows 3-4, column K
- **Count**: 2
- **What it computes**: `K3=J3*0.0012`, `K4=J4*0.0012` — converts a design-condition
  value (column J, appears to be a flow or enthalpy-related figure per row 3/4 context)
  by a fixed constant 0.0012. This constant matches the standard air heat-capacity
  approximation (1.2 kg/m3 x 1.0 kJ/kg-K /1000, or similar), consistent with it being
  used downstream as the `$K$3`/`$K$4`-style specific-heat x density constant seen in
  T8-T10. Flagged for confirmation against the INPUT_MAPPING documentation since the
  literal constant `0.0012` is not self-documenting from the formula alone.

### T31 — Ratio of ratios (design condition check)
- **Template**: `=(CR-CR)/(CR-CR)`
- **Section**: Row 4/6, column U
- **Count**: 2
- **What it computes**: `U4=(U3-V3)/(U3-W3)` — a ratio used only twice, likely a
  local sanity-check or a normalized-position calculation for a design condition
  (e.g. where on a psychrometric line a state point falls between two references).
  Not otherwise referenced elsewhere in the sampled formulas — worth confirming its
  consumer, if any, since it looks like a leftover diagnostic cell.

### T32 — Effectiveness-blend variant with unmatched trailing IF (missing else-branch)
- **Template**: `=IF(CR<$C$R,-$C$R*(CR-$C$R)+CR,IF(AND(CR>=$C$R,CR<=$C$R),CR,IF(CR>$C$R,-$C$R*(CR-$C$R)+CR)))`
- **Section**: Rows 11, columns E/F (design-condition rows, not the hourly loop)
- **Count**: 2
- **What it computes**: Similar effectiveness-blend logic to T12/T13 but for the
  two fixed design-condition rows only; note the final `IF(E10>$C$4,...)` has **no
  false-branch argument**, so Excel implicitly returns `FALSE` if temp is exactly at
  the boundary in a way that falls through — a minor logic gap worth replicating
  faithfully or flagging in the TS port (matches Excel's own behavior of returning
  boolean `FALSE` for a missing IF argument, which would need explicit handling in
  TypeScript since `false` is not a valid temperature).
- **Verbatim example**: `E11=IF(E10<$C$3,-$G$3*(E10-$C$3)+E10,IF(AND(E10>=$C$3,E10<=$C$4),E10,IF(E10>$C$4,-$G$4*(E10-$C$4)+E10)))`

### T33 — Whitespace-only reformatted duplicate of T13
- **Template**: identical logic to T13, differs only in indentation/line-break
  formatting (normalizes to the same string after whitespace-insensitive comparison,
  but was counted separately in raw-string grouping before whitespace normalization).
- **Section**: Rows 60-83, scattered columns (e.g. `K60` vs `JF60`)
- **Count**: 48
- **Note**: Confirmed logically identical to T13 by diffing with whitespace stripped;
  listed separately here only to document that the raw file contains two differently
  -formatted copies of the same formula, which a TS port should treat as one function.

---

## Anomalies / things to double-check before porting

1. **T19/T20 duplicated without `$` anchors (rows 2 and 10, column AS/AU)**: Two
   cells (`AS2`/`AS10` and `AU10`) contain the same operational-cost / GHG formula as
   T19/T20 but with **unanchored relative references** (`AK5` instead of `$AK$5`-style,
   and referencing row 5's cells literally rather than being relative to their own
   row). Since these live at row 2 and row 10 — outside the normal 5-scenario-row
   block (rows 5-9) — they are very likely stray/leftover cells from copy-pasting the
   formula down and not part of the live calculation path (row 2 is in the config
   header area, row 10 is labeled "Option 5" which does not otherwise appear
   populated like rows 5-9). Recommend confirming these are dead cells with no
   downstream references before deciding whether the TS port needs a 5-scenario or
   6-scenario model.
2. **T21 vs T22 (capital cost) inconsistency**: `AT10=SUM($AM$3:$AP$3)` sums only
   4 cells (`AM,AN,AO,AP`) while `AT5..AT9=$AM$3+$AN$3+$AO$3+$AP$3+$AQ$3` sum 5
   cells (adds `AQ3`). If row 10 ("Option 5") is meant to be a live scenario, its
   capital cost is silently missing one cost component compared to rows 5-9 — flag
   this as a likely bug in the source workbook rather than intended behavior.
3. **T30 constant `0.0012`**: A bare numeric literal multiplying column J; verify
   against INPUT_MAPPING what column J represents at rows 3/4 (appears to be duct
   design airflow or similar) so the TS port names this constant meaningfully
   instead of inlining `0.0012`.
4. **T31 `(U3-V3)/(U3-W3)`**: Only 2 occurrences, no confirmed downstream consumer
   found in the sampled columns — recommend a targeted search of the full column U
   dependency graph before deciding whether to port this cell at all.
5. **T32 missing else-branch**: `IF(E10>$C$4, -$G$4*(E10-$C$4)+E10)` has no third
   argument, so Excel returns `FALSE` when `E10<=$C$4` is also false due to earlier
   branches already covering `>=` and `<=` — in practice this branch is likely
   unreachable given the preceding `AND` branch covers the boundary, but should be
   coded as an explicit unreachable/error case in TS rather than silently returning
   a boolean.
6. **No cached `#REF!`/`#VALUE!`/other Excel error strings** were found in the cached
   values of rows 1-398 (checked all 106,831 formula cells' cached results across
   the full column range) — the workbook currently calculates cleanly for whatever
   inputs were live at last save.
7. **No circular references detected** in the sampled formula set — all dependencies
   in the hourly engine flow strictly downward/rightward (day-column chaining reads
   only the reference day column D or the row directly above within the same
   column), and the scenario/analysis block only reads from rows above it (14 -> 22,
   5-9 -> nowhere circular).

---

## Summary

- **Total formula cells in scope (A1:NK398)**: 106,831
- **Total distinct normalized templates**: 33 (or 32 if T33 is merged into T13 as a
  pure whitespace duplicate, which it should be for the TypeScript port)
- **Sections represented**: config passthrough (T1-T3), psychrometric/hourly engine
  (T4-T14), monthly rollup (T15-T18), scenario summary (T19-T23), final comparison
  block (T24-T28), and low-count/anomalous cells (T29-T33).
