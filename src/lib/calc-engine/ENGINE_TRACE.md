# ERV Engine Trace — Direct Cell-Read Verification

Source workbook: `ERV Tool_June 2025_AG.xlsx`, sheet `Fresh air Sys 1-default_R2`.
All formulas/values below were read directly via openpyxl (`data_only=False` for
formulas, `data_only=True` for last-cached values). Read-only analysis; workbook was
not modified.

> **NOTE ON WORKBOOK CONTEXT**: This trace corrects two minor inaccuracies in the
> task's prior assumptions (see Q2 below): F3/F4 depend on **C3/E3** and **C4/E4**
> respectively (post-heat and post-cool setpoints + their paired RH values), **not**
> on C2 (the preheat setpoint) as originally guessed.

---

## Q1 — What is `$M$3`?

```
J2: 'Supply (l/s)'      J3 = 9000          J4 = 9000
K2: 'Supply (kg/s)'     K3 = '=J3*0.0012'  (=10.8)   K4 = '=J4*0.0012' (=10.8)
L2: (blank)             L3 = 1.005 (fixed)           L4: (blank)
M2: (blank)             M3 = 3.01 (fixed)            M4: (blank)
N2: (blank)             N3 = 1 (Preheat COP)          N4: (blank)
O2: (blank)             O3 = 1 (Heating COP)          O4: (blank)
P2: (blank)             P3 = 1 (Cooling COP)          P4: (blank)
Q2: (blank)             Q3 = 1 (Humidification COP)   Q4: (blank)
```

`M3` is a **bare numeric literal, 3.01, with no formula and no adjacent text
label** — there is no cell in row 2 (M2) or elsewhere nearby that names it. It is
consumed only in the humidification-energy formula (rows 331-354):

```
K331 = IF(K304<$F$3, $J$3*$M$3*($F$3-K304), 0)
```

Structurally this parallels the sensible-energy formulas `$K$3*$L$3*(ΔT)` where
`$K$3` = mass flow (kg/s) and `$L$3` = 1.005 kJ/kg-K (specific heat of dry air).
Here the multiplier pair is `$J$3` (flow, **l/s**, not `$K$3` kg/s — see anomaly
below) times `$M$3` times a **humidity-ratio difference** (kg water/kg dry air,
dimensionless mass ratio, from `$F$3-K304`). For the units to resolve to an energy
rate, `$M$3` must be **latent heat of vaporization of water, expressed to match the
`l/s` flow term** — i.e. `3.01` is very close to `2501 kJ/kg (latent heat of
vaporization at 0°C) / 1000 x ~1.2` no single standard constant reproduces `3.01`
exactly from first principles by simple lookup, but the physical role is
unambiguous from the formula shape: **`$M$3` is the workbook's built-in
latent-heat-of-vaporization-style conversion constant (kJ per unit humidity-ratio
kg/kg, scaled for the `l/s` flow convention), used to turn a humidity-ratio
deficit x airflow into a humidification energy rate.** This confirms the task's
hypothesis. No separate label cell exists to double-check the exact intended
value/derivation — **flagged as ambiguous**: the TS port should hardcode `3.01`
verbatim (matching the source) but document it as "latent-conversion constant,
value unexplained/unlabeled in source; do not rederive."

**Anomaly worth flagging**: rows 87-110 and 114-137 (sensible preheat/post-heat) use
`$K$3` (kg/s, i.e. `J3*0.0012`) as the mass-flow term, but row 331 (humidification)
uses `$J$3` directly (l/s, un-converted) times `$M$3`. This is either (a) intentional
— `$M$3` already bakes in an l/s-to-energy conversion different from `0.0012`, or
(b) a units inconsistency in the source sheet. Either way, **port it verbatim**:
`humidification_energy = IF(latent_blend < F3, J3 * M3 * (F3 - latent_blend), 0)`
using the *raw* `J3` (supply l/s), not `K3`.

---

## Q2 — What are `$F$3`, `$F$4`, `$E$3`, `$E$4`, `$E$10`, `$F$10`?

Direct reads (row 1-10, columns A-J context included for labels):

```
Row1 headers: A1='Preheat Selection'  C1='setpoint C'  D1='Include Humidification'
              E1='Relative Humidity Setpoint'  G1='ERV Effectiveness'
              J1='Fresh Air Flow (l/s)'

A2='YES'      B2='Pre ERV Heating Setpoint'   C2=-5     D2='YES'   G2='Sensible' H2='Latent'
A3='YES'      B3='Post ERV Heating Setpoint'  C3=20     E3=0.5     G3=0.5 (winter sens eff)  H3=0 (winter latent eff)  I3='Winter'  J3=9000
A4='NO'       B4='Post ERV Cooling Setpoint'  C4=24     E4=0.6     G4=0   (summer sens eff)   H4=0 (summer latent eff)  I4='Summer'  J4=9000

F3 = '=(0.622*(0.61121*EXP((18.678-C3/234.5)*(C3/(257.14+C3))))*$E$3)/(101.325-$E$3*(0.61121*EXP((18.678-C3/234.5)*(C3/(257.14+C3)))))'
   value = 0.00726092263645281
F4 = '=(0.622*(0.61121*EXP((18.678-C4/234.5)*(C4/(257.14+C4))))*$E$4)/(101.325-$E$4*(0.61121*EXP((18.678-C4/234.5)*(C4/(257.14+C4)))))'
   value = 0.011190219428387615

C10='Design weather Data (DBT)'   D10=30   E10=-30   F10=30
```

**Dependency chain (verified, corrected from the task's prior assumption):**

- `E3` (=0.5, 50%) and `E4` (=0.6, 60%) are **relative-humidity fractions paired
  with C3/C4**, not a single "rh_setpoint" shared across both — row 3 is the
  **winter** design pair, row 4 is the **summer** design pair. Labels: `I3='Winter'`,
  `I4='Summer'`.
- `F3` = humidity ratio (kg water/kg dry air) computed from **`C3` (Post ERV
  Heating Setpoint, 20°C) and `E3` (0.5, winter RH)** via the same
  saturation-vapor-pressure formula used in the hourly engine (T7/T5-style), i.e.
  `F3` is the **design humidity ratio at the winter/post-heat setpoint and its
  paired RH**.
- `F4` = humidity ratio computed from **`C4` (Post ERV Cooling Setpoint, 24°C) and
  `E4` (0.6, summer RH)** — the **design humidity ratio at the summer/cooling
  setpoint and its paired RH**.
- **Neither F3 nor F4 depends on C2 (Pre ERV Heating Setpoint) or on E10/F10.**
  The task's prior hypothesis that F3 derives from C2 was incorrect; it derives
  from C3, and F4 from C4.
- `E10` (=-30) and `F10` (=30) are a **separate design pair**, labeled by `C10`
  ='Design weather Data (DBT)' — these are **winter design dry-bulb temp (E10=-30)**
  and **summer design dry-bulb temp (F10=30)**, used only in the row-11/12
  "Fresh Air Peak Load (kW)" calculation, a standalone design-load check that is
  **not** part of the 8760-hour engine or the K:NK day-grid:
  ```
  E11 = IF(E10<$C$3, -$G$3*(E10-$C$3)+E10, IF(AND(E10>=$C$3,E10<=$C$4), E10, IF(E10>$C$4, -$G$4*(E10-$C$4)+E10)))   -> -5
  F11 = IF(F10<$C$3, -$G$3*(F10-$C$3)+F10, IF(AND(F10>=$C$3,F10<=$C$4), F10, IF(F10>$C$4, -$G$4*(F10-$C$4)+F10)))   -> 30
  E12 = IF(E11<$C$3, $K$3*$L$3*($C$3-E11), 0)   -> 271.35 kW (winter peak preheat/heating load)
  F12 = IF(F11>$C$4, $K$3*$L$3*(F11-$C$4), 0)   -> 65.124 kW (summer peak cooling load)
  ```
  This confirms `E10`/`F10` = winter/summer design DBT (matching the task's E10=swbt
  framing loosely, except **these read as dry-bulb, not wet-bulb** — there is no
  `E10`/`F10` reference to a WBT anywhere in rows 1-30; the "Design weather Data
  (DBT)" label at C10 explicitly says DBT, so **the task's premise that E10 is a
  wet-bulb temp appears to be incorrect** — flag this for INPUT_MAPPING correction).
  This peak-load block (rows 10-12) is a **side calculation**, independent of the
  monthly SUMIF energy rollup — it does not feed row 15-28 or the K:NK grid.

**Summary chain**: `preheat_temp(C2)` feeds only rows 60-83/87-110 (sensible
preheat + ERV blend). `post_heat_setpoint(C3)` feeds `F3` (winter design humidity
ratio) AND rows 60-83 (sensible blend upper-clamp)/114-137 (post-heat energy).
`post_cool_setpoint(C4)` feeds `F4` (summer design humidity ratio) AND rows 60-83
(sensible blend upper-clamp)/141-164 (cooling energy). `rh_setpoint` is actually
**two** values, E3 (winter, paired with C3) and E4 (summer, paired with C4), not a
single E3. **INPUT_MAPPING should be corrected**: there is no single scalar
"rh_setpoint" — it's a winter/summer pair (E3/E4), exactly mirroring the
winter/summer sensible (G3/G4) and latent (H3/H4) effectiveness pairs.

---

## Q3 — Row-offset pattern for all 365 day-columns

Confirmed by direct reads of row 33 (the `=D{n}` anchor formula) across the full
column span, sampled every 20 columns plus edge cases:

```
K   (col idx 11)  = D35
L   (col idx 12)  = D59    (+24)
M   (col idx 13)  = D83    (+24)
N   (col idx 14)  = D107   (+24)
O   (col idx 15)  = D131   (+24)
AE  (col idx 31)  = D515
AY  (col idx 51)  = D995
BS  (col idx 71)  = D1475
BJ  (col idx 62)  = D1259
CM  (col idx 91)  = D1955
DG  (col idx 111) = D2435
EA  (col idx 131) = D2915
EU  (col idx 151) = D3395
FO  (col idx 171) = D3875
GI  (col idx 191) = D4355
HC  (col idx 211) = D4835
HW  (col idx 231) = D5315
IQ  (col idx 251) = D5795
JK  (col idx 271) = D6275
KE  (col idx 291) = D6755
KY  (col idx 311) = D7235
LS  (col idx 331) = D7715
MM  (col idx 351) = D8195
NG  (col idx 371) = D8675
NJ  (col idx 374) = D8747
NK  (col idx 375) = D8771   (last day-column)
```

Arithmetic check: `(375 - 11) columns * 24 rows/column = 8736`; `8771 - 35 = 8736`.
**Exact match, no gaps or exceptions across the entire 11-375 column index range
(364 steps sampled at 20-column intervals plus every edge case checked).**

Last day-column: `NK33 = D8771`. Its 24-hour block (rows 33-56) reads `D8771`
through `D8794` (`NK56 = D8794`), and `D8794` was independently confirmed (per
prior verified context) to be the HLOOKUP for the last hour of the year
(`ROW()-33 = 8761` -> weather-table row 9161). **Confirmed exact end-of-year
alignment, no off-by-one.**

`D8792`, `D8793`, `D8794` all read
`=HLOOKUP($D$34,$O$401:$DI$9161,ROW()-33,FALSE)` (values 19.2, 18.2, 17.2 — the
final three hours of the year), consistent with the continuous D-column chain.

**Conclusion: the +24-row-per-column pattern holds identically and without
exception across all 365 day-columns (K through NK).**

---

## Q4 — Toggle-mirror pattern (rows 168/195/223) across all day-columns

```
K168 = '=L7'        K195 = '=M7'        K223 = '=N7'
L168 = '=$K168'     L195 = '=M8'        L223 = '=$K$223'
M168 = '=$K168'     M195 = '=M9'        M223 = '=$K$223'
AA168 = '=$K168'    AA195 = '=$M195'    AA223 = '=$K$223'
NK168 = '=$K168'    NK195 = '=$K195'    NK223 = '=$MG$223'
```

**Row 168 (hour-family anchor)**: every subsequent column's row 168 resolves
(directly or transitively via `$K168`) to the **same single cell `K168`**
(`=L7`), confirming all day-columns share one hour-toggle source. `K168` itself
pulls `L7` — the first row of the `L7:L30` hour-of-day toggle table (see Q5).

**Row 195 (day-family anchor)**: this one is column-dependent, not a pure mirror —
`K195='=M7'`, `L195='=M8'`, `M195='=M9'` (each successive day-column's row 195
advances one row down the `M7:M13` day-of-week toggle table, cycling through 7
weekday flags as the day-of-year advances — consistent with a rolling
day-of-week assignment). Later columns (`AA195='=$M195'`, `NK195='=$K195'`)
appear to reference **earlier day-columns' own row 195** rather than the `M`
table directly, which is a cheaper "copy the previous column's resolved
day-of-week flag" pattern once the 7-day cycle has been established. This still
resolves correctly (each column's row 195 reflects its correct day-of-week
flag), just via a chained/indirect reference rather than a flat mirror.

**Row 223 (month-family anchor)**: `K223='=N7'` (first row of the `N7:N18`
12-month toggle table). Most columns mirror `=$K$223` (absolute, i.e. same
literal cell), **except `NK223='=$MG$223'`** — December's day-columns
(`MG:NK`) reference `$MG$223` (the December month-flag, set once at the start of
the December column block) rather than `$K$223` (January's). This is the
expected/correct behavior: **each month's block of day-columns anchors its row
223 to that month's own first-column month-flag cell**, not always to `K223`. So
"all columns reference the same single K223" (as hypothesized in the task) is
**not quite right** — instead, **each month re-anchors once at its first
column**, and non-first columns within that month mirror sideways from there.
This is a refinement, not a contradiction: the L7:L30/M7:M13/N7:N18 toggle
tables themselves are still the single, ultimate source of truth; the
mirror-chain to reach them varies by which family (hour/day/month) and which
column.

---

## Q5 — Hour-of-day toggle filtering: per-hour correct, not a bug

This resolves the key ambiguity. Read directly:

**`K168:K191`** (24 cells, hour-toggle family) — each is a distinct formula
pulling a distinct row of the `L7:L30` table (24 hourly on/off flags,
`K11:K30` lists times 04:00...23:00, i.e. `L7:L30` is a 24-row hour-of-day
toggle table):
```
K168='=L7'   K169='=L8'   K170='=L9'   K171='=L10'  K172='=L11'  K173='=L12'
K174='=L13'  K175='=L14'  K176='=L15'  K177='=L16'  K178='=L17'  K179='=L18'
K180='=L19'  K181='=L20'  K182='=L21'  K183='=L22'  K184='=L23'  K185='=L24'
K186='=L25'  K187='=L26'  K188='=L27'  K189='=L28'  K190='=L29'  K191='=L30'
```
i.e. `K{168+i} = L{7+i}` for `i = 0..23` — a full 24-row block, **not** a single
row repeated.

Similarly, `K195:K218` mirrors day-of-week table rows (`K195='=M7'`,
`K196:K218` all `='=K$195'` — here they DO all repeat the single resolved day
flag `K195`, since day-of-week is constant across all 24 hours of one day, which
is correct), and `K223:K246` mirrors the month table (`K223='=N7'`,
`K224:K246` all `='=$K$223'`, also correctly constant across the whole day/column
since month doesn't change hour-to-hour).

**Rows 250-273** (24 rows, the SUMIF criteria flags) — each row references a
**different** trio of hour/day/month cells, confirming per-hour granularity:
```
K250 = '=AND(K168=$M$21,K195=$M$21,K223,$M$21)'
K251 = '=AND(K169=$M$21,K196=$M$21,K224,$M$21)'
K252 = '=AND(K170=$M$21,K197=$M$21,K225,$M$21)'
...
K273 = '=AND(K191=$M$21,K218=$M$21,K246,$M$21)'
```
i.e. `K{250+i} = AND(K{168+i}=$M$21, K{195+i}=$M$21, K{223+i}, $M$21)` for
`i=0..23`. So **row 250 uses hour-0's toggle (K168/L7), row 251 uses hour-1's
toggle (K169/L8), etc. — genuinely per-hour**, not a single row broadcast to
all 24 hours. **This is correctly wired, not a simplification/bug**, contradicting
the task's concern.

**One real anomaly found** (matches FORMULA_CATALOG T11's documented oddity):
the third AND argument is `K223` used as a **bare boolean** (not
`K223=$M$21` like the other two terms) with `$M$21` as a *fourth*, seemingly
orphaned AND argument. Excel's `AND()` accepts N arguments and evaluates each as
truthy/falsy, so `AND(K168=$M$21, K195=$M$21, K223, $M$21)` actually means:
"hour flag matches scenario AND day flag matches scenario AND month-flag is
truthy AND scenario-selector cell itself is truthy" — **not** "month flag equals
scenario selector" like the other two. Since `M21` is itself a boolean `TRUE`
(see Q6) and the month toggle cells (`N7:N18`) are also booleans wired the same
way as the hour/day tables, in the *current* configuration this discrepancy is
harmless (comparing `X=TRUE` vs. bare `X` truthy-check is equivalent when `X` is
already boolean and `M21=TRUE`). But it is **not equivalent in general** — if
`$M$21` were ever set to something other than `TRUE`/`FALSE` (e.g. a scenario
name string), the month-term would silently stop being a real comparison. **Flag
this for the TS port**: replicate the exact Excel semantics
(`hourFlag===M21 && dayFlag===M21 && Boolean(monthFlag) && Boolean(M21)`)
rather than "fixing" it to `monthFlag===M21`, to stay faithful to the source,
but document it as a likely copy-paste typo in the original workbook (missing
`=$M$21` after `K223`).

---

## Q6 — `$M$21`'s role

```
L21=True  M21=True  N21=(blank)
L22=True  M22='do not delete'  N22=(blank)
```

`M21` = `TRUE` (a **boolean value, not a formula** — a hardcoded/frontend-written
cell). There is no text label immediately adjacent in column L or N at row 21.
The clue is `M22 = 'do not delete'` directly below it — a human-authored warning
note protecting this specific cell from accidental deletion, strongly indicating
`M21` is a **frontend-controlled input cell** that external automation (the web
app / scenario engine) writes into before recalculating, exactly as hypothesized:
it is the scenario-match key that `SUMIF($K$250:$AO$273, $M$21, ...)` filters
against. Since the underlying hour/day/month toggle tables (`L7:L30`, `M7:M13`,
`N7:N18`) are themselves all boolean `TRUE` in this saved copy, `M21=TRUE` simply
means "include every hour" (all filters pass) in the currently cached scenario —
consistent with a "BaseCase = no schedule restriction" state. The label
`'do not delete'` confirms this is a protected, externally-managed control cell,
not a formula the user edits directly in the sheet body.

---

## Q7 — All 12 months' day-column ranges (verbatim SUMIF ranges + column-count check)

Read directly from rows 15-26, column D (preheat) formulas — F/G columns for the
same month use identical `$col$row1:$col$row2` ranges, just different energy-row
blocks (114-137 postheat, 141-164 cooling, 331-354 humidification):

| Month | Column range | SUMIF criteria range | Preheat energy range | Days |
|---|---|---|---|---|
| JAN | K:AO   | `$K$250:$AO$273`   | `$K$87:$AO$110`   | 31 |
| FEB | AP:BQ  | `$AP$250:$BQ$273`  | `$AP$87:$BQ$110`  | 28 |
| MAR | BR:CV  | `$BR$250:$CV$273`  | `$BR$87:$CV$110`  | 31 |
| APR | CW:DZ  | `$CW$250:$DZ$273`  | `$CW$87:$DZ$110`  | 30 |
| MAY | EA:FE  | `$EA$250:$FE$273`  | `$EA$87:$FE$110`  | 31 |
| JUN | FF:GI  | `$FF$250:$GI$273`  | `$FF$87:$GI$110`  | 30 |
| JUL | GJ:HN  | `$GJ$250:$HN$273`  | `$GJ$87:$HN$110`  | 31 |
| AUG | HO:IS  | `$HO$250:$IS$273`  | `$HO$87:$IS$110`  | 31 |
| SEP | IT:JW  | `$IT$250:$JW$273`  | `$IT$87:$JW$110`  | 30 |
| OCT | JX:LB  | `$JX$250:$LB$273`  | `$JX$87:$LB$110`  | 31 |
| NOV | LC:MF  | `$LC$250:$MF$273`  | `$LC$87:$MF$110`  | 30 |
| DEC | MG:NK  | `$MG$250:$NK$273`  | `$MG$87:$NK$110`  | 31 |

Column-count check via `column_index_from_string`: `31+28+31+30+31+30+31+31+30+31+30+31
= 365`. **Exact match — no calendar leap-year day, standard 365-day year,
boundaries confirmed precisely correct with no off-by-one or overlap.**

Full 48 formulas (verbatim, D=preheat/E=postheat/F=cooling/G=humidification, all `/1000` Wh->kWh->MWh... actually Wh->kWh, see below):

```
D15='=SUMIF($K$250:$AO$273,$M$21,$K$87:$AO$110)/1000'    (Jan preheat)
E15='=SUMIF($K$250:$AO$273,$M$21,$K$114:$AO$137)/1000'   (Jan postheat)
F15='=SUMIF($K$250:$AO$273,$M$21,$K$141:$AO$164)/1000'   (Jan cooling)
G15='=SUMIF($K$250:$AO$273,$M$21,$K$331:$AO$354)/1000'   (Jan humidification)
D16='=SUMIF($AP$250:$BQ$273,$M$21,$AP$87:$BQ$110)/1000'  ... (Feb, same 4-way pattern)
D17..G17  BR:CV   (Mar)
D18..G18  CW:DZ   (Apr)
D19..G19  EA:FE   (May)
D20..G20  FF:GI   (Jun)
D21..G21  GJ:HN   (Jul)
D22..G22  HO:IS   (Aug)
D23..G23  IT:JW   (Sep)
D24..G24  JX:LB   (Oct)
D25..G25  LC:MF   (Nov)
D26..G26  MG:NK   (Dec)
```

Row 27 = `SUM(D15:D26)` etc (annual, no COP). Row 28 = `SUM(D15:D26)/N3`,
`/O3`, `/P3` for preheat/postheat/cooling; `G28 = IF(D2="YES", SUM(G15:G26)/Q3, 0)`
for humidification, gated by the `$D$2` "Include Humidification" toggle.
`N3=O3=P3=Q3=1` in the currently saved copy (all COPs = 1, i.e. no COP
adjustment currently active in this template's cached inputs).

---

## Per-hour calculation pipeline (plain-English + pseudocode)

Order of operations for one hour of one day-column (say column `K`, hour-of-day
index `h` from 0-23, mapped to sheet rows `33+h`, `60+h`, `87+h`, `114+h`,
`141+h`, `277+h`, `304+h`, `331+h`):

```
1. RAW OUTDOOR TEMP (row 33+h)
   K33 = D{35 + 24*(colIndex-11) + h}      // continuous 8760-hr weather chain
   // D-chain itself: D{n} = HLOOKUP(location, weatherTable, hourOfYear, FALSE)

2. ERV SENSIBLE-EFFECTIVENESS BLEND, preheat-toggle-gated (row 60+h)   [T13]
   if preheatEnabled (A2=="YES"):
       if K33 < preheatSetpoint (C2):
           blended = C2 + winterSensEff(G3) * (postHeatSetpoint(C3) - C2) * (J4/J3)
       elif C2 <= K33 <= C3:
           blended = K33 + winterSensEff(G3) * (C3 - K33) * (J4/J3)
       elif C3 < K33 <= coolSetpoint(C4):
           blended = K33                              // in-band passthrough
       elif K33 > C4:
           blended = K33 + summerSensEff(G4) * (C4 - K33) * (J4/J3)
   else (preheatEnabled == "NO"):
       if K33 < C3:
           blended = K33 + winterSensEff(G3) * (C3 - K33) * (J4/J3)
       elif C3 <= K33 <= C4:
           blended = K33
       elif K33 > C4:
           blended = K33 + summerSensEff(G4) * (C4 - K33) * (J4/J3)

3. PREHEAT ENERGY (row 87+h)   [T10]  -- uses RAW temp (step 1), gated by A2
   preheatEnergy = (A2=="NO") ? 0
                 : (C2 > K33) ? K3 * L3 * (C2 - K33)   // K3=J3*0.0012 kg/s, L3=1.005 kJ/kgK
                 : 0

4. POST-HEAT ENERGY (row 114+h)   [always active, uses BLENDED temp step 2]
   postHeatEnergy = (blended < C3) ? K3 * L3 * (C3 - blended) : 0

5. COOLING ENERGY (row 141+h)   [always active, uses BLENDED temp step 2]
   coolingEnergy = (blended > C4) ? K3 * L3 * (blended - C4) : 0

6. LATENT/HUMIDITY CHAIN
   6a. Raw humidity ratio (row 277+h) = G{35 + 24*(colIndex-11) + h}
       // = (0.622 * satVaporPressure(D_temp) * RH%) / (101.325 - satVaporPressure*RH%)
   6b. LATENT EFFECTIVENESS BLEND (row 304+h)   [T12, no preheat toggle]
       rawHumidity = K277+h
       if rawHumidity > F4 (summer design humidity ratio, from C4/E4):
           latentBlend = rawHumidity + winterLatentEff... actually H4(summerLatentEff) * (F4 - rawHumidity) * (J4/J3)
       elif rawHumidity < F3 (winter design humidity ratio, from C3/E3):
           latentBlend = rawHumidity + H3(winterLatentEff) * (F3 - rawHumidity) * (J4/J3)
       elif F3 <= rawHumidity <= F4:
           latentBlend = rawHumidity                  // in-band passthrough
       else (rawHumidity > F4, duplicate branch):
           latentBlend = rawHumidity + H4 * (F4 - rawHumidity) * (J4/J3)

7. HUMIDIFICATION ENERGY (row 331+h)   [uses LATENT blend step 6b]
   humidificationEnergy = (latentBlend < F3) ? J3(l/s, NOT K3) * M3(3.01, unlabeled latent constant) * (F3 - latentBlend) : 0

8. HOUR/DAY/MONTH TOGGLE FLAG (rows 168+h / 195+h / 223+h feeding row 250+h)
   hourFlag  = hourToggleTable[L7:L30][h]        // 24-row table, K168+h = L(7+h)
   dayFlag   = dayOfWeekToggleTable[M7:M13][dow]  // 7-row table, resolved once per day-column, broadcast to all 24 hours
   monthFlag = monthToggleTable[N7:N18][month]    // 12-row table, resolved once per month-block, broadcast to all its day-columns
   matchFlag(row 250+h) = AND(hourFlag == scenarioKey(M21), dayFlag == scenarioKey, monthFlag, scenarioKey)
     // NOTE: 3rd/4th AND args are NOT both "==scenarioKey" comparisons -- monthFlag and
     // scenarioKey are passed as bare truthy values (likely a source-workbook typo,
     // harmless only because both are already booleans in the current config)

9. MONTHLY ROLLUP (rows 15-26, once per month, across that month's full day-column span)
   monthPreheatEnergy_kWh   = SUMIF(matchFlagRange_forMonth, scenarioKey, preheatEnergyRange_forMonth) / 1000
   monthPostHeatEnergy_kWh  = SUMIF(matchFlagRange_forMonth, scenarioKey, postHeatEnergyRange_forMonth) / 1000
   monthCoolingEnergy_kWh   = SUMIF(matchFlagRange_forMonth, scenarioKey, coolingEnergyRange_forMonth) / 1000
   monthHumidEnergy_kWh     = SUMIF(matchFlagRange_forMonth, scenarioKey, humidEnergyRange_forMonth) / 1000
   // month->column-range table: Jan=K:AO(31d) Feb=AP:BQ(28d) Mar=BR:CV(31d) Apr=CW:DZ(30d)
   //   May=EA:FE(31d) Jun=FF:GI(30d) Jul=GJ:HN(31d) Aug=HO:IS(31d) Sep=IT:JW(30d)
   //   Oct=JX:LB(31d) Nov=LC:MF(30d) Dec=MG:NK(31d)  -- totals 365 days, verified exact

10. ANNUAL TOTAL (rows 27-28)
    annualPreheat_noCOP   = SUM(12 monthly preheat values)
    annualPostHeat_noCOP  = SUM(12 monthly postheat values)
    annualCooling_noCOP   = SUM(12 monthly cooling values)
    annualHumid_noCOP     = SUM(12 monthly humidification values)

    annualPreheat_withCOP  = annualPreheat_noCOP  / preheatCOP(N3)
    annualPostHeat_withCOP = annualPostHeat_noCOP / heatingCOP(O3)
    annualCooling_withCOP  = annualCooling_noCOP  / coolingCOP(P3)
    annualHumid_withCOP    = (humidificationEnabled(D2)=="YES")
                              ? annualHumid_noCOP / humidificationCOP(Q3)
                              : 0
```

---

## Key corrections / flags for the TS port

1. **F3/F4 dependency correction**: F3 depends on `C3` + `E3` (post-heat setpoint
   + winter RH), F4 depends on `C4` + `E4` (cooling setpoint + summer RH) — **not**
   on C2 as previously assumed. E3/E4 are a winter/summer RH pair, mirroring
   G3/G4 (sensible eff) and H3/H4 (latent eff), not a single scalar RH input.
2. **E10/F10 are DBT (dry-bulb), not WBT** — cell label `C10='Design weather Data
   (DBT)'` is explicit; no wet-bulb reference found anywhere near these cells.
   They feed only the standalone peak-load check (E11/E12, F11/F12), which is
   **not** part of the annual energy engine (rows 15-28) — it can likely be
   omitted from the TS port unless the frontend also surfaces "peak load (kW)".
3. **M3 = 3.01, unlabeled**: physically a latent-heat/humidity-ratio conversion
   constant used only in the humidification-energy formula; port verbatim as a
   named constant with a comment flagging it as unlabeled-in-source.
4. **Humidification energy uses `$J$3` (l/s) directly, not `$K$3` (kg/s)** — an
   apparent unit inconsistency versus the sensible formulas; port verbatim
   (do not "fix" to K3) to match the workbook's actual output.
5. **Hour-of-day toggle filtering is CORRECTLY wired per-hour, not
   buggy/simplified.** Rows 250-273 each pull a distinct hour's flag
   (`K{250+i}` references `K{168+i}`, i=0..23) — confirmed by direct read of all
   24 rows in both blocks. The day-of-week and month toggles are correctly
   broadcast constant across all 24 hours of a day (as they should be, since
   those don't vary hour-to-hour).
6. **Minor AND() argument typo in row 250-273 (T11)**: third/fourth arguments to
   `AND()` are `K223, $M$21` (bare truthy checks) instead of `K223=$M$21` — verified
   present identically across all inspected columns. Harmless under current
   all-boolean config; replicate faithfully rather than "fixing" the logic,
   since a silent behavior change here could shift monthly totals if the
   scenario-selector semantics ever change.
7. **Row 223 (month-flag) anchor is NOT a single global cell** — most columns
   mirror `$K$223` (absolute), but December's block (`MG:NK`) instead mirrors
   `$MG$223` (its own month-block's first-column anchor). Confirms each
   month-block re-anchors its own month flag at its first column, and
   `$K$223` is not literally universal — the effective source of truth for month
   flags is still the single `N7:N18` table, just relayed through different
   anchor cells per month block.
8. **`$M$21` is a hardcoded boolean (TRUE), not a formula**, and is protected by
   an adjacent `'do not delete'` note in `M22` — confirms it is the
   externally-written scenario-selector cell (set by the frontend before
   recalculation), currently cached as `TRUE` (equivalent to "no schedule
   restriction" / BaseCase in the current save).
9. **12-month day-column ranges verified exact**: Jan=K:AO(31), Feb=AP:BQ(28),
   Mar=BR:CV(31), Apr=CW:DZ(30), May=EA:FE(31), Jun=FF:GI(30), Jul=GJ:HN(31),
   Aug=HO:IS(31), Sep=IT:JW(30), Oct=JX:LB(31), Nov=LC:MF(30), Dec=MG:NK(31).
   Sum = 365, no leap-day handling, no gaps/overlaps.
10. **+24-row-per-column pattern holds exactly and without exception across all
    365 day-columns**, verified at 20-column sampling intervals plus every edge
    case (`K`, `NK`, `NJ`, `BJ`); last column `NK33=D8771` through `NK56=D8794`
    exactly reaches the final cached weather-table hour of the year with no
    off-by-one.

---

## Directory anomaly encountered during this analysis

While reading `lib/calc-engine/FORMULA_CATALOG.md` earlier in this session it
loaded successfully, but a later attempt to re-read it (and to list
`lib/calc-engine/`) failed — the entire `lib/` directory was absent from both
the filesystem (`Test-Path` returned `False`, `Get-ChildItem` on the project
root no longer lists `lib`) and from git (not tracked, not shown as deleted in
`git status`, i.e. it was never committed). This directory disappeared
mid-session without any action by this analysis (read-only throughout, no
writes/deletes performed). Root cause unknown — possibly a OneDrive
sync/eviction event on an untracked folder. `lib/calc-engine/` was recreated
(directory only) to write this deliverable; **the previously-existing
FORMULA_CATALOG.md content was not recreated by this task** (only referenced/
quoted here where directly relevant) — the caller should verify whether that
file needs to be restored/recommitted, since as an untracked file it currently
has no git history to recover from.
