"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export interface CustomWeatherSummary {
  id: string;
  name: string;
  sourceFilename: string;
  createdAt: string;
}

export interface CustomWeatherData extends CustomWeatherSummary {
  dbt: number[];
  rh: number[];
}

const EXPECTED_HOURS = 8760;

function isValidHourlyArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === EXPECTED_HOURS && value.every((v) => typeof v === "number" && Number.isFinite(v));
}

/**
 * Saves a parsed .epw file's hourly weather data so it can be reused across
 * projects/scenarios without re-uploading. Every function here uses the
 * service-role client (bypasses RLS), so each independently checks the session and
 * scopes to owner_id -- see supabase/schema.sql for why.
 */
export async function saveCustomWeather(
  name: string,
  sourceFilename: string,
  dbt: number[],
  rh: number[],
): Promise<{ id: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "You must be logged in to save a weather file." };
  if (!name.trim()) return { error: "Location name is required." };
  if (!isValidHourlyArray(dbt) || !isValidHourlyArray(rh)) {
    return { error: `Weather data must contain exactly ${EXPECTED_HOURS} hourly values for both temperature and humidity.` };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custom_weather_files")
    .insert({
      owner_id: session.userId,
      name: name.trim(),
      source_filename: sourceFilename,
      dbt,
      rh,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function listCustomWeather(): Promise<CustomWeatherSummary[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createAdminClient();
  const { data: adminUser } = await supabase.from("users").select("id").eq("email", "admin@gmail.com").single();
  const adminId = adminUser?.id;

  let query = supabase.from("custom_weather_files").select("id, name, source_filename, created_at, owner_id");
  if (adminId && adminId !== session.userId) {
    query = query.or(`owner_id.eq.${session.userId},owner_id.eq.${adminId}`);
  } else {
    query = query.eq("owner_id", session.userId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name + (adminId && row.owner_id === adminId && session.userId !== adminId ? " (Global Admin)" : ""),
    sourceFilename: row.source_filename,
    createdAt: row.created_at,
  }));
}

export async function getCustomWeather(id: string): Promise<CustomWeatherData | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custom_weather_files")
    .select("id, name, source_filename, created_at, dbt, rh")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    sourceFilename: data.source_filename,
    createdAt: data.created_at,
    dbt: data.dbt as number[],
    rh: data.rh as number[],
  };
}

export async function deleteCustomWeather(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "You must be logged in." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("custom_weather_files").delete().eq("id", id).eq("owner_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
