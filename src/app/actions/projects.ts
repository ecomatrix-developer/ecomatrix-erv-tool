"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import type { ScenarioInputsPayload } from "@/lib/calc-engine/request";
import type { CalculateResult } from "@/lib/calc-engine/types";

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scenarioCount: number;
}

/**
 * Every function below uses the service-role client, which bypasses RLS entirely,
 * so each one must independently verify the session and scope its query to
 * owner_id === session.userId -- there is no database-level backstop for this app's
 * custom auth (see supabase/schema.sql for why).
 */

/** Creates a new project owned by the current user; used by the "Enter project name" modal. */
export async function createProject(name: string): Promise<{ id: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "You must be logged in to create a project." };
  if (!name.trim()) return { error: "Project name is required." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ owner_id: session.userId, name: name.trim() })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/history");
  return { id: data.id };
}

interface ProjectWithScenarioCount {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  scenarios: { count: number }[];
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at, updated_at, scenarios(count)")
    .eq("owner_id", session.userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as ProjectWithScenarioCount[]).map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    scenarioCount: p.scenarios?.[0]?.count ?? 0,
  }));
}

export async function getProject(id: string) {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at, updated_at")
    .eq("id", id)
    .eq("owner_id", session.userId)
    .single();

  if (error) return null;
  return data;
}

/** Replaces every scenario row for a project with the given set (BaseCase..Option 4, in order). */
export async function saveScenarios(
  projectId: string,
  scenarios: { label: string; inputs: ScenarioInputsPayload; outputs: CalculateResult["scenarios"][number] | null }[],
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "You must be logged in." };

  const supabase = createAdminClient();

  // Ownership check before mutating: the service-role client would otherwise happily
  // write to any project_id regardless of who's asking.
  const owned = await getProject(projectId);
  if (!owned) return { error: "Project not found." };

  const { error: deleteError } = await supabase.from("scenarios").delete().eq("project_id", projectId);
  if (deleteError) return { error: deleteError.message };

  if (scenarios.length > 0) {
    const { error: insertError } = await supabase.from("scenarios").insert(
      scenarios.map((s, i) => ({
        project_id: projectId,
        label: s.label,
        position: i,
        inputs: s.inputs,
        outputs: s.outputs,
      })),
    );
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/history");
  revalidatePath(`/dashboard/${projectId}`);
  return { ok: true };
}

export async function getScenarios(projectId: string) {
  const session = await getSession();
  if (!session) return [];

  const owned = await getProject(projectId);
  if (!owned) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("id, label, position, inputs, outputs")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function deleteProject(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "You must be logged in." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("owner_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/history");
  return { ok: true };
}

export interface ProjectAnalyticsData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  scenarios: {
    label: string;
    inputs: ScenarioInputsPayload;
    outputs: CalculateResult["scenarios"][number] | null;
  }[];
}

export async function getAllProjectsWithScenarios(): Promise<ProjectAnalyticsData[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at, updated_at, scenarios(label, position, inputs, outputs)")
    .eq("owner_id", session.userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    scenarios: Array<{ label: string; position: number; inputs: unknown; outputs: unknown }>;
  }>).map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    scenarios: (p.scenarios || [])
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        label: s.label,
        inputs: s.inputs as ScenarioInputsPayload,
        outputs: s.outputs as CalculateResult["scenarios"][number] | null,
      })),
  }));
}

