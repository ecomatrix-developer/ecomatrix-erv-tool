import { NextResponse } from "next/server";
import { runAllScenarios } from "@/lib/calc-engine/engine";
import { parseCalculateRequest, ValidationError } from "@/lib/calc-engine/request";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  let scenarioInputs;
  try {
    scenarioInputs = parseCalculateRequest(body);
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const result = runAllScenarios(scenarioInputs);
  return NextResponse.json(result);
}
