import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEpw, EpwParseError } from "../epw-parser";

const SAMPLE_PATH = join(__dirname, "../../../public/CAN_AB_CALGARY-INTL-A_3031092_CWEC.epw");

describe("parseEpw", () => {
  const sampleText = readFileSync(SAMPLE_PATH, "utf8");
  const sampleParsed = parseEpw(sampleText);

  it("extracts the location name from the LOCATION header line", () => {
    expect(sampleParsed.locationName).toContain("CALGARY INTL A");
  });

  it("extracts 8760 hourly dry-bulb temperature and relative humidity values", () => {
    expect(sampleParsed.dbt).toHaveLength(8760);
    expect(sampleParsed.rh).toHaveLength(8760);
  });

  it("reads the correct dbt/rh values for the first two hours", () => {
    expect(sampleParsed.dbt[0]).toBe(-16.2);
    expect(sampleParsed.rh[0]).toBe(73);
    expect(sampleParsed.dbt[1]).toBe(-13.7);
    expect(sampleParsed.rh[1]).toBe(74);
  });

  it("rejects a file that doesn't start with a LOCATION header", () => {
    expect(() => parseEpw("NOT,A,VALID,HEADER\n")).toThrow(EpwParseError);
  });

  it("rejects a file with too few data rows", () => {
    const header = Array(8).fill("HEADER LINE").join("\n");
    const shortBody = "2003,1,1,1,0,x,-16.2,-19.6,73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0";
    expect(() => parseEpw(`LOCATION,Test City,,,,,,,,\n${header}\n${shortBody}`)).toThrow(EpwParseError);
  });
});
