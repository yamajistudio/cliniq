"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authLimiter, sensitiveLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

function getClientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// ── Sign In ──────────────────────────────────────────────────────────────────

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Rate limit by IP
  const ip = getClientIp();
  const rl = authLimiter.check(`signin:${ip}`);
  if (!rl.allowed) {
    redirect("/login?error=Muitas%20tentativas.%20Aguarde%201%20minuto.");
  }

  if (!email || !password) {
    redirect("/login?error=Email%20e%20senha%20sao%20obrigatorios.");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // Ensure profile + clinic exist (idempotent — handles users created before this fix)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileAndClinic(supabase, user.id, email);
  }

  redirect("/dashboard");
}

// ── Sign Up (complete flow) ──────────────────────────────────────────────────

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const clinicName = String(formData.get("clinic_name") ?? "").trim();

  // Rate limit by IP
  const ip = getClientIp();
  const rl = authLimiter.check(`signup:${ip}`);
  if (!rl.allowed) {
    redirect("/signup?error=Muitas%20tentativas.%20Aguarde%201%20minuto.");
  }

  if (!email || !password) {
    redirect("/signup?error=Email%20e%20senha%20sao%20obrigatorios.");
  }
  if (password.length < 6) {
    redirect(
      "/signup?error=Senha%20deve%20ter%20pelo%20menos%206%20caracteres."
    );
  }

  const supabase = createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    redirect(`/signup?error=${encodeURIComponent(authError.message)}`);
  }

  const userId = authData.user?.id;
  if (!userId) {
    redirect("/signup?error=Falha%20ao%20criar%20conta.%20Tente%20novamente.");
  }

  // 2. Auto-sign in to get authenticated session for RLS
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // If email confirmation is required, redirect to login with success
    redirect(
      "/login?success=Cadastro%20criado.%20Verifique%20seu%20email%20e%20faca%20login."
    );
  }

  // 3. Create profile + clinic + membership + trial
  try {
    await ensureProfileAndClinic(
      supabase,
      userId,
      email,
      clinicName || undefined
    );
  } catch (err) {
    logger.error("[SignUp] Erro ao configurar clínica no cadastro", err, { userId });
    // Don't block signup — user can complete onboarding later
  }

  redirect("/dashboard/onboarding");
}

// ── Ensure Profile + Clinic (idempotent) ─────────────────────────────────────

async function ensureProfileAndClinic(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  clinicName?: string
) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingProfile) {
    // Create profile
    await supabase.from("profiles").insert({
      id: userId,
      full_name: email.split("@")[0] ?? "Usuário",
      email,
    });
  }

  // Check if user already has a clinic membership
  const { data: existingMembership } = await supabase
    .from("clinic_memberships")
    .select("id, clinic_id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (existingMembership) return; // Already has a clinic

  // Create clinic
  const name = clinicName || `Clínica de ${email.split("@")[0]}`;
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({ name })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    throw new Error(`Falha ao criar clínica: ${clinicError?.message}`);
  }

  // Create membership as CLINIC_ADMIN
  await supabase.from("clinic_memberships").insert({
    clinic_id: clinic.id,
    user_id: userId,
    role: "CLINIC_ADMIN",
    status: "ACTIVE",
  });

  // Create trial subscription (14 days)
  const { data: starterPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "starter")
    .maybeSingle();

  if (starterPlan) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await supabase.from("subscriptions").upsert(
      {
        clinic_id: clinic.id,
        plan_id: starterPlan.id,
        status: "TRIAL",
        trial_end: trialEnd.toISOString(),
        started_at: new Date().toISOString(),
      },
      { onConflict: "clinic_id" }
    );
  }
}

// ── Password Reset ───────────────────────────────────────────────────────────

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/forgot-password?error=Informe%20o%20email.");

  // Rate limit: sensitive action (3/min)
  const ip = getClientIp();
  const rl = sensitiveLimiter.check(`reset:${ip}`);
  if (!rl.allowed) {
    redirect("/forgot-password?error=Muitas%20tentativas.%20Aguarde%201%20minuto.");
  }

  const supabase = createClient();
  const origin = headers().get("origin") ?? "";
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error)
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);

  redirect(
    "/forgot-password?success=Se%20o%20email%20existir,%20enviamos%20o%20link%20de%20redefinicao."
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!password || password.length < 6) {
    redirect(
      "/reset-password?error=Senha%20deve%20ter%20pelo%20menos%206%20caracteres."
    );
  }
  if (password !== confirm) {
    redirect("/reset-password?error=As%20senhas%20nao%20conferem.");
  }

  const supabase = createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    redirect(
      "/login?error=Sessao%20invalida.%20Solicite%20a%20redefinicao%20novamente."
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);

  redirect("/login?success=Senha%20atualizada.%20Faca%20login.");
}

// ── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
