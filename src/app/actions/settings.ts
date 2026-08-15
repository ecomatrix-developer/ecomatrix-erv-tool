"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, deleteSession } from "@/lib/session";

/** Deletes all projects and scenario calculations belonging to the logged-in user */
export async function deleteAllProjectsAction(): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must be logged in to perform this action." };

  const supabase = createAdminClient();

  // Find user projects
  const { data: userProjects, error: fetchErr } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", session.userId);

  if (fetchErr) return { success: false, message: fetchErr.message };

  if (userProjects && userProjects.length > 0) {
    const projectIds = userProjects.map((p) => p.id);

    // Delete scenarios first
    await supabase.from("scenarios").delete().in("project_id", projectIds);

    // Delete projects
    const { error: delErr } = await supabase.from("projects").delete().eq("owner_id", session.userId);
    if (delErr) return { success: false, message: delErr.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/reports");
  revalidatePath("/settings");

  return { success: true, message: "All user projects and scenarios have been permanently deleted." };
}

/** Clears old calculation history & cached scenarios for the current user */
export async function clearOldDataAction(): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must be logged in to perform this action." };

  const supabase = createAdminClient();

  // Delete older scenarios or orphan calculation records
  const { data: userProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", session.userId);

  if (userProjects && userProjects.length > 0) {
    const projectIds = userProjects.map((p) => p.id);
    await supabase.from("scenarios").delete().in("project_id", projectIds);
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/reports");
  revalidatePath("/settings");

  return { success: true, message: "Old calculation cache and scenario data successfully cleared." };
}

/** Permanently deletes the user account, session, and associated data */
export async function deleteAccountAction(): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) return { success: false, message: "You must be logged in to perform this action." };

  const supabase = createAdminClient();

  // 1. Delete scenarios
  const { data: userProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("owner_id", session.userId);

  if (userProjects && userProjects.length > 0) {
    const projectIds = userProjects.map((p) => p.id);
    await supabase.from("scenarios").delete().in("project_id", projectIds);
  }

  // 2. Delete projects
  await supabase.from("projects").delete().eq("owner_id", session.userId);

  // 3. Delete user account from database
  const { error: userDelErr } = await supabase.from("users").delete().eq("id", session.userId);
  if (userDelErr) {
    console.warn("Could not delete user row:", userDelErr.message);
  }

  // 4. Delete session cookie
  await deleteSession();

  return { success: true, message: "Your account and all associated data have been permanently deleted." };
}
