export type ClinicRole =
  | "CLINIC_ADMIN"
  | "MANAGER"
  | "DOCTOR"
  | "RECEPTIONIST";

export type UserContext = {
  userId: string;
  clinicId: string | null;
  role: ClinicRole | null;
  roles: ClinicRole[];
};

function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").trim().toUpperCase();
}

export function isClinicAdmin(ctx: UserContext): boolean {
  return normalizeRole(ctx.role) === "CLINIC_ADMIN";
}

export function isManager(ctx: UserContext): boolean {
  return (
    normalizeRole(ctx.role) === "MANAGER" ||
    normalizeRole(ctx.role) === "CLINIC_ADMIN"
  );
}

export function isDoctor(ctx: UserContext): boolean {
  return normalizeRole(ctx.role) === "DOCTOR";
}

export function isReceptionist(ctx: UserContext): boolean {
  return normalizeRole(ctx.role) === "RECEPTIONIST";
}

export function canManagePatients(ctx: UserContext): boolean {
  return ctx.role !== null;
}

export function canManageAppointments(ctx: UserContext): boolean {
  return ctx.role !== null;
}

export function canManageLeads(ctx: UserContext): boolean {
  const r = normalizeRole(ctx.role);
  return ["CLINIC_ADMIN", "MANAGER", "RECEPTIONIST"].includes(r);
}

export function canManageStaff(ctx: UserContext): boolean {
  return isClinicAdmin(ctx);
}

export function canManageSettings(ctx: UserContext): boolean {
  return isClinicAdmin(ctx);
}
