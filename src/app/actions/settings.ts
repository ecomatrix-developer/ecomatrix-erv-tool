"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

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
