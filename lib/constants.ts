// ── Shared constants ─────────────────────────────────────────────────────────
// Used by server services and client components.
// Do NOT import server-only modules here.

// ── Planos / Trial ───────────────────────────────────────────────────────────

export const TRIAL_DURATION_DAYS = 14;
export const INVITE_EXPIRATION_DAYS = 7;

// ── Métodos de pagamento ──────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { value: "PIX",            label: "Pix" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO",  label: "Cartão de Débito" },
  { value: "DINHEIRO",       label: "Dinheiro" },
  { value: "CONVENIO",       label: "Convênio" },
  { value: "OUTRO",          label: "Outro" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

// ── Origens de lead / paciente ────────────────────────────────────────────────

export const LEAD_SOURCES = [
  { value: "WEBSITE",   label: "Site" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WHATSAPP",  label: "WhatsApp" },
  { value: "INDICACAO", label: "Indicação" },
  { value: "GOOGLE",    label: "Google" },
  { value: "OUTRO",     label: "Outro" },
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCES)[number]["value"];

// ── Day of week labels ───────────────────────────────────────────────────────

export const DAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const DAY_NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
