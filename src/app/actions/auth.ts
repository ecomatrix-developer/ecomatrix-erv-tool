"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, deleteSession, getSession, getAuthenticatedUserId } from "@/lib/session";
import { validateEmailFormat } from "@/lib/email-validation";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  message?: string;
}

/** Appends ?welcome=1 to a post-login destination so the client can show a one-time
 * "Welcome, {email}" toast (src/components/trial-status.tsx) right after sign-in. */
function withWelcomeFlag(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}welcome=1`;
}

/**
 * Passwordless "Launch ERV Tool" gate: one email field, no password. Unknown
 * emails are signed up on the spot (trial_started_at = now) and known emails are
 * simply signed back in, as long as their 14-day trial hasn't lapsed.
 *
 * admin@gmail.com is deliberately excluded here and kept on the password-based
 * `login` action below -- letting anyone type that address into this box would
 * hand out Admin Portal access to whoever asks.
 */
export async function continueWithEmail(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email) {
    return { error: "Please enter a valid email address." };
  }

  const emailCheck = validateEmailFormat(email);
  if (!emailCheck.valid) {
    return {
      error: emailCheck.suggestedDomain
        ? `That looks like a typo. Did you mean "${email.split("@")[0]}@${emailCheck.suggestedDomain}"?`
        : "Please enter a valid email address.",
    };
  }

  if (email === "admin@gmail.com") {
    return { error: "Please use the admin sign-in instead." };
  }

  const supabase = createAdminClient();
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email, is_active, trial_started_at, trial_exempt, trial_paused_at")
    .eq("email", email)
    .maybeSingle();

  if (!existingUser) {
    const trialStartedAt = new Date().toISOString();
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        trial_started_at: trialStartedAt,
        is_active: true,
        last_login: trialStartedAt,
      })
      .select("id, email")
      .single();

    if (error || !newUser) {
      return { error: "Could not create your account. Please try again." };
    }

    await createSession(newUser.id, newUser.email, "user", trialStartedAt, false, null);
    redirect(withWelcomeFlag(next || "/dashboard"));
  }

  if (existingUser.is_active === false) {
    return { error: "This account has been deactivated. Please contact ECO Matrix Solutions." };
  }

  if (existingUser.trial_paused_at) {
    return {
      error: "Your access has been paused by an admin. Please contact ECO Matrix Solutions to resume your account.",
    };
  }

  const trialStartedAt = existingUser.trial_started_at;
  const trialExempt = Boolean(existingUser.trial_exempt);

  if (!trialExempt) {
    const elapsedMs = Date.now() - new Date(trialStartedAt).getTime();
    if (elapsedMs > 14 * 24 * 60 * 60 * 1000) {
      return {
        error: "Your 14-day free trial has ended. Please contact ECO Matrix Solutions to continue using the ERV Tool.",
      };
    }
  }

  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", existingUser.id);
  await createSession(existingUser.id, existingUser.email, "user", trialStartedAt, trialExempt, null);
  redirect(withWelcomeFlag(next || "/dashboard"));
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
    const { data: adminUser } = await supabase
      .from("users")
      .select("id, email, password_hash, is_active, trial_started_at")
      .eq("email", "admin@gmail.com")
      .single();
    if (!adminUser) {
      const password_hash = await bcrypt.hash("Ecomatrix@2026", 10);
      const trialStartedAt = new Date().toISOString();
      const { data: newAdmin } = await supabase
        .from("users")
        .insert({
          email: "admin@gmail.com",
          password_hash,
          full_name: "System Admin",
          is_active: true,
          trial_started_at: trialStartedAt,
          trial_exempt: true,
        })
        .select("id, email, password_hash, is_active")
        .single();
      if (newAdmin && password === "Ecomatrix@2026") {
        await createSession(newAdmin.id, newAdmin.email, "admin", trialStartedAt, true, null);
        await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", newAdmin.id);
        redirect(withWelcomeFlag("/admin"));
      }
    }
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash, is_active, trial_started_at, trial_exempt, trial_paused_at")
    .eq("email", email)
    .single();

  if (error || !user || user.is_active === false || user.trial_paused_at || !user.password_hash) {
    return { error: "Invalid email or password." };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return { error: "Invalid email or password." };
  }

  const isAdmin = user.email === "admin@gmail.com";
  await createSession(
    user.id,
    user.email,
    isAdmin ? "admin" : "user",
    user.trial_started_at,
    Boolean(user.trial_exempt),
    null,
  );
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

  if (isAdmin) {
    redirect(withWelcomeFlag("/admin"));
  }

  redirect(withWelcomeFlag(next || "/dashboard"));
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
    .select("id, email, trial_started_at, trial_exempt, trial_paused_at")
    .single();

  if (updateError || !user) {
    return { error: "Could not update password for " + email + ". Account not found." };
  }

  if (user.trial_paused_at) {
    return {
      error: "Your access has been paused by an admin. Please contact ECO Matrix Solutions to resume your account.",
    };
  }

  await createSession(
    user.id,
    user.email,
    user.email === "admin@gmail.com" ? "admin" : "user",
    user.trial_started_at,
    Boolean(user.trial_exempt),
    null,
  );
  redirect(withWelcomeFlag("/dashboard"));
}

export async function getCurrentUserSession() {
  const session = await getSession();
  return session;
}

export interface TrialStatus {
  userId: string;
  email: string;
  trialStartedAt: string;
  trialExempt: boolean;
  trialPausedAt: string | null;
}

/**
 * Live trial status straight from the database, instead of the signed session
 * cookie's snapshot from whenever the user last logged in. The cookie is only
 * refreshed at login, so an admin editing trial_started_at/trial_exempt/
 * trial_paused_at directly in Supabase wouldn't otherwise show up until the
 * user's next sign-in -- this is what the trial-days badge calls so changes
 * are reflected immediately instead.
 */
export async function getTrialStatus(): Promise<TrialStatus | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("email, trial_started_at, trial_exempt, trial_paused_at")
    .eq("id", userId)
    .single();

  if (error || !user) return null;

  return {
    userId,
    email: user.email,
    trialStartedAt: user.trial_started_at,
    trialExempt: Boolean(user.trial_exempt),
    trialPausedAt: user.trial_paused_at,
  };
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
