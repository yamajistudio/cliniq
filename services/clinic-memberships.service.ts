import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { UserContext, ClinicRole } from "@/lib/permissions";

type ClinicMembershipRow =
  Database["public"]["Tables"]["clinic_memberships"]["Row"];
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

type ClinicMembership = ClinicMembershipRow & {
  clinic: ClinicRow | null;
};

const ACTIVE_CLINIC_COOKIE = "crm_active_clinic";

function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").trim().toUpperCase();
}

function serviceError(base: string, raw: unknown, context: string) {
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof (raw as any)?.message === "string"
      ? (raw as any).message
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${context}]: ${msg}`);
}

// ── Core queries ─────────────────────────────────────────────────────────────

export async function getClinicMemberships(
  userId: string
): Promise<ClinicMembership[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_memberships")
    .select("*, clinic:clinics(*)")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true });

  if (error) {
    throw serviceError(
      "Falha ao buscar vínculos de clínica",
      error,
      "clinic_memberships.select"
    );
  }

  return (data ?? []) as ClinicMembership[];
}

// ── Active clinic (cookie-based) ─────────────────────────────────────────────

function getActiveClinicIdFromCookie(): string | null {
  try {
    const cookieStore = cookies();
    const value = cookieStore.get(ACTIVE_CLINIC_COOKIE)?.value;
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function setActiveClinic(clinicId: string): void {
  try {
    const cookieStore = cookies();
    cookieStore.set(ACTIVE_CLINIC_COOKIE, clinicId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  } catch {
    // May fail in Server Components (read-only context)
  }
}

// ── getUserContext (respects active clinic cookie) ────────────────────────────

export async function getUserContext(userId: string): Promise<UserContext> {
  const memberships = await getClinicMemberships(userId);

  const roles: ClinicRole[] = [];
  let clinicId: string | null = null;
  let role: ClinicRole | null = null;

  if (memberships.length === 0) {
    return { userId, clinicId: null, role: null, roles: [] };
  }

  // Collect all roles
  memberships.forEach((m) => {
    const r = normalizeRole(m.role) as ClinicRole;
    if (r && !roles.includes(r)) roles.push(r);
  });

  // Determine active clinic: cookie > first membership
  const cookieClinicId = getActiveClinicIdFromCookie();
  const activeMembership = cookieClinicId
    ? memberships.find((m) => m.clinic_id === cookieClinicId)
    : null;

  const primary = activeMembership ?? memberships[0];
  clinicId = primary.clinic_id;
  role = primary.role as ClinicRole;

  // If cookie pointed to a clinic the user no longer has access to, reset
  if (cookieClinicId && !activeMembership) {
    setActiveClinic(clinicId);
  }

  return { userId, clinicId, role, roles };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function getCurrentClinic(
  userId: string
): Promise<ClinicMembership | undefined> {
  const memberships = await getClinicMemberships(userId);
  const cookieClinicId = getActiveClinicIdFromCookie();

  if (cookieClinicId) {
    const match = memberships.find((m) => m.clinic_id === cookieClinicId);
    if (match) return match;
  }

  return memberships[0];
}

export function hasRole(ctx: UserContext, role: string): boolean {
  const target = normalizeRole(role);
  return ctx.roles.some((r) => normalizeRole(r) === target);
}
