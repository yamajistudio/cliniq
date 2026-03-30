// ── Lead Status ──────────────────────────────────────────────
export const LEAD_STATUS = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contactado",
  QUALIFIED: "Qualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
};

export const LEAD_FLOW: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["QUALIFIED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  CONVERTED: [],
  LOST: ["NEW"],
};

// ── Appointment Status ───────────────────────────────────────
export const APPOINTMENT_STATUS = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export const APPOINTMENT_FLOW: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: ["SCHEDULED"],
  NO_SHOW: ["SCHEDULED"],
};

export const APPOINTMENT_STATUS_COLOR: Record<AppointmentStatus, string> = {
  SCHEDULED: "#3B82F6",
  CONFIRMED: "#6366F1",
  IN_PROGRESS: "#EAB308",
  COMPLETED: "#22C55E",
  CANCELLED: "#EF4444",
  NO_SHOW: "#F97316",
};

export const APPOINTMENT_STATUS_BG: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-50 border-blue-200 text-blue-700",
  CONFIRMED: "bg-indigo-50 border-indigo-200 text-indigo-700",
  IN_PROGRESS: "bg-yellow-50 border-yellow-200 text-yellow-700",
  COMPLETED: "bg-green-50 border-green-200 text-green-700",
  CANCELLED: "bg-red-50 border-red-200 text-red-500",
  NO_SHOW: "bg-orange-50 border-orange-200 text-orange-700",
};

// ── Patient Status ───────────────────────────────────────────
export const PATIENT_STATUS = ["ACTIVE", "INACTIVE"] as const;
export type PatientStatus = (typeof PATIENT_STATUS)[number];

export const PATIENT_STATUS_LABEL: Record<PatientStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

// ── Lead Source ──────────────────────────────────────────────
export const LEAD_SOURCE = [
  "WEBSITE",
  "INSTAGRAM",
  "WHATSAPP",
  "INDICACAO",
  "GOOGLE",
  "OUTRO",
] as const;
export type LeadSource = (typeof LEAD_SOURCE)[number];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  WEBSITE: "Website",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  INDICACAO: "Indicação",
  GOOGLE: "Google",
  OUTRO: "Outro",
};
