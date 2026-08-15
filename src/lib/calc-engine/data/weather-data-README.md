# weather-data.json

Extracted from `ERV Tool_June 2025_AG.xlsx`, sheet `Fresh air Sys 1-default_R2`.

## Source ranges

- Dry-bulb temperature (DBT) block: columns O:DI (99 columns), header row 401.
- Relative humidity (RH) block: columns DL:HF (99 columns), header row 401.
- Both blocks list cities in the same left-to-right order (verified).
- Weather data rows: 402-9161 in each city's column. Row 402 is blank in the source
  workbook for every city (never populated). Row 403 = hour 1 of the year, row 9161 =
  hour 8759 (last hour). This gives 8759 real values per city, not a full 8760.

## Row-index convention (confirmed by tracing the live formula, not guessed)

The engine's HLOOKUP is `=HLOOKUP($D$34, <weather-range-starting-row-401>, ROW()-33, FALSE)`.
HLOOKUP's row_index_num=1 returns the header row itself (row 401 = city names), so
row_index N returns weather row `401 + (N-1)`. Traced two boundary cells directly:

- `D36` (`ROW()-33=3`) -> row_index 3 -> weather row 403 = **hour 1 of the year**.
- `D8794` (`ROW()-33=8761`) -> row_index 8761 -> weather row 9161 = **hour 8759**, the
  last row with data.
- `D35` is NOT its own HLOOKUP — its formula is literally `=D36`, a cosmetic duplicate
  of hour 1 (matches the source label "1 day, 0:00:00" vs row 36's "01:00:00"). It is
  never itself read from the weather table; row 402 (which would be its notional
  weather row) is genuinely blank and unused.

**Practical consequence for this JSON**: each city's `dbt`/`rh` array has exactly 8760
entries to stay a clean full-year length, where index 0 is a duplicate of index 1
(mirroring the source's `D35=D36` behavior) and indices 1-8759 are the real hour-1
through hour-8759 values read from weather rows 403-9161. There is no data for a
theoretical "hour 8760" — the source workbook itself only carries 8759 real hours.

## Duplicate city names resolved

The raw sheet has 86 named columns per block but only 84 distinct city names:

- **"Brandon" appears twice**: column W (`CAN_MB_Brandon.RCS.711360_TMYx.2009-2023.epw`)
  and column CP (`CAN_MB_BRANDON-A_5010481_CWEC.epw`). `new.py`'s `cityWeatherFiles`
  dict (the frontend's authoritative city->file mapping) maps `"Brandon"` to the
  `BRANDON-A` file, so the CP-column data was kept and the W-column data dropped.
- **"New York" appears twice**, columns BJ and BK, both pointing at the identical EPW
  file (`USA_NY_New_York-Central_Park_725033_TMY3.epw`) — a pure duplicate column with
  no distinguishing source. The first occurrence (BJ) was kept, the second dropped.
- 13 further trailing columns (CW:DI in the DBT block, and their RH counterparts) have
  no city name and no data at all — ignored.
- Disambiguation was done **by position** (Nth occurrence of a name in the DBT block
  matched to the Nth occurrence in the RH block), since the RH block's row 399
  (EPW filename) is blank throughout and can't be used directly for RH-side matching.

Final city count: **84**, matching `new.py`'s `cityWeatherFiles` city list.

## Validation performed

- Confirmed `data.cities.length === Object.keys(data.hourly).length === 84` (no name
  collisions in the output).
- Confirmed every city has exactly 8760 `dbt` values and 8760 `rh` values, all numeric
  (zero nulls, zero non-numeric cells).
- Spot-checked Pune and London's first/last hourly DBT values against direct
  `data_only=True` cell reads of the source workbook — exact match.

## Shape

```json
{
  "cities": ["Amsterdam", "Atlanta", ...],
  "hourly": {
    "Amsterdam": { "dbt": [8760 numbers], "rh": [8760 numbers] },
    ...
  }
}
```
