"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean | null;
  created_at: string;
  last_login: string | null;
  role?: string;
}

export interface AdminWeatherRecord {
  id: string;
  name: string;
  source_filename: string;
  created_at: string;
  dbt_sample?: number[];
  rh_sample?: number[];
}

const GLOBAL_ADMIN_OWNER_ID = "00000000-0000-0000-0000-000000000001";

async function verifyAdminSession() {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin" || session.email === "admin@gmail.com") {
    return session;
  }
  return null;
}

/** Get list of all users for admin management */
export async function getUsersList(): Promise<{ users?: UserRecord[]; error?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, is_active, created_at, last_login")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  const users = (data ?? []).map((u) => ({
    ...u,
    role: u.email === "admin@gmail.com" ? "admin" : "user",
  }));

  return { users };
}

/** Admin action to create a new user account */
export async function createAdminUserAccount(formData: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ success?: boolean; error?: string; userId?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  const email = formData.email.trim().toLowerCase();
  const password = formData.password.trim();
  const fullName = formData.fullName?.trim() || "";

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 6) return { error: "Password must be at least 6 characters long." };

  const supabase = createAdminClient();

  // Check if user exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) return { error: `User with email ${email} already exists.` };

  const password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash,
      full_name: fullName || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true, userId: data.id };
}

/** Admin action to delete a user account */
export async function deleteAdminUserAccount(userId: string): Promise<{ success?: boolean; error?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  if (adminSession.userId === userId) {
    return { error: "You cannot delete your own admin session account." };
  }

  const supabase = createAdminClient();

  // Check user email
  const { data: targetUser } = await supabase.from("users").select("email").eq("id", userId).single();
  if (targetUser?.email === "admin@gmail.com") {
    return { error: "Root admin account cannot be deleted." };
  }

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Admin action to update user password */
export async function changeUserPassword(userId: string, newPassword: string): Promise<{ success?: boolean; error?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  if (!newPassword || newPassword.trim().length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const password_hash = await bcrypt.hash(newPassword.trim(), 10);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({
      password_hash,
      password_changed_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Admin action to toggle user active status */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<{ success?: boolean; error?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Admin action to publish a global weather file accessible by ALL users */
export async function adminUploadGlobalWeather(
  name: string,
  sourceFilename: string,
  dbt: number[],
  rh: number[],
): Promise<{ success?: boolean; error?: string; id?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  if (!name.trim()) return { error: "Weather location name is required." };
  if (!Array.isArray(dbt) || dbt.length !== 8760 || !Array.isArray(rh) || rh.length !== 8760) {
    return { error: "Weather file must contain exactly 8,760 hourly data rows for DBT and RH." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custom_weather_files")
    .insert({
      owner_id: adminSession.userId,
      name: name.trim(),
      source_filename: sourceFilename,
      dbt,
      rh,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/simulator");
  return { success: true, id: data.id };
}

/** List all global weather files published by Admin */
export async function listGlobalWeatherFiles(): Promise<AdminWeatherRecord[]> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custom_weather_files")
    .select("id, name, source_filename, created_at, dbt, rh")
    .eq("owner_id", adminSession.userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    source_filename: row.source_filename,
    created_at: row.created_at,
    dbt_sample: Array.isArray(row.dbt) ? row.dbt.slice(0, 24) : [],
    rh_sample: Array.isArray(row.rh) ? row.rh.slice(0, 24) : [],
  }));
}

/** Delete a global admin weather file */
export async function deleteGlobalWeatherFile(id: string): Promise<{ success?: boolean; error?: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession) return { error: "Unauthorized access." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("custom_weather_files").delete().eq("id", id).eq("owner_id", adminSession.userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/simulator");
  return { success: true };
}
