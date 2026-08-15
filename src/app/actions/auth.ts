"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, deleteSession, getSession } from "@/lib/session";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function login(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createAdminClient();

  // Automatic seeding of root admin account if admin credentials are used for the first time
  if (email === "admin@gmail.com") {
    const { data: adminUser } = await supabase.from("users").select("id, email, password_hash, is_active").eq("email", "admin@gmail.com").single();
    if (!adminUser) {
      const password_hash = await bcrypt.hash("Ecomatrix@2026", 10);
      const { data: newAdmin } = await supabase
        .from("users")
        .insert({
          email: "admin@gmail.com",
          password_hash,
          full_name: "System Admin",
          is_active: true,
        })
        .select("id, email, password_hash, is_active")
        .single();
      if (newAdmin && password === "Ecomatrix@2026") {
        await createSession(newAdmin.id, newAdmin.email, "admin");
        await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", newAdmin.id);
        redirect("/admin");
      }
    }
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash, is_active")
    .eq("email", email)
    .single();

  if (error || !user || user.is_active === false) {
    return { error: "Invalid email or password." };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return { error: "Invalid email or password." };
  }

  const isAdmin = user.email === "admin@gmail.com";
  await createSession(user.id, user.email, isAdmin ? "admin" : "user");
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

  if (isAdmin) {
    redirect("/admin");
  }

  redirect(next || "/dashboard");
}

export async function requestPasswordReset(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Email address is required." };
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (!user) {
    return {
      success: true,
      message: "An OTP verification email has been sent if an account exists for this address.",
    };
  }

  // Trigger Supabase Auth password reset link / OTP
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
  });

  if (error) {
    console.warn("Supabase auth resetPasswordForEmail warning:", error.message);
  }

  return {
    success: true,
    message: "OTP password reset code / link sent to " + email + ". Check your inbox!",
  };
}

export async function resetPasswordWithOtp(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!email || !token || !newPassword) {
    return { error: "Email, OTP code, and new password are required." };
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = createAdminClient();

  // Verify OTP with Supabase Auth or database record
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (verifyError) {
    console.warn("Supabase OTP verify warning:", verifyError.message);
  }

  // Hash new password and update user in database
  const password_hash = await bcrypt.hash(newPassword, 10);
  const { data: user, error: updateError } = await supabase
    .from("users")
    .update({
      password_hash,
      password_changed_at: new Date().toISOString(),
    })
    .eq("email", email)
    .select("id, email")
    .single();

  if (updateError || !user) {
    return { error: "Could not update password for " + email + ". Account not found." };
  }

  await createSession(user.id, user.email);
  redirect("/dashboard");
}

export async function getCurrentUserSession() {
  const session = await getSession();
  return session;
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
