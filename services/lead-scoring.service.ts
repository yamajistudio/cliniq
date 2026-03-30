import { createClient } from "@/lib/supabase/server";
import { isValidUuid } from "@/lib/validation/ids";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScoreLabel = "COLD" | "WARM" | "HOT" | "VERY_HOT";

export type LeadScore = {
  score: number;
  label: ScoreLabel;
  factors: Record<string, number>;
  updatedAt: string | null;
};

export type ScoreHistoryEntry = {
  score: number;
  score_label: ScoreLabel;
  score_factors: Record<string, number>;
  trigger_event: string | null;
  created_at: string;
};

// Extended lead row that includes scoring columns (added via migration 016)
export type ScoredLeadRow = {
  id: string;
  clinic_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  notes: string | null;
  score: number;
  score_label: ScoreLabel;
  score_factors: Record<string, number>;
  score_updated_at: string | null;
  asked_about_price: boolean;
  asked_about_availability: boolean;
  total_interactions: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

// ── Score config for UI ───────────────────────────────────────────────────────

export const SCORE_CONFIG: Record<
  ScoreLabel,
  { color: string; bgColor: string; label: string; emoji: string }
> = {
  COLD:     { color: "text-slate-600",  bgColor: "bg-slate-100",  label: "Frio",          emoji: "🔵" },
  WARM:     { color: "text-amber-700",  bgColor: "bg-amber-100",  label: "Morno",          emoji: "🟡" },
  HOT:      { color: "text-orange-700", bgColor: "bg-orange-100", label: "Quente",         emoji: "🟠" },
  VERY_HOT: { color: "text-red-700",    bgColor: "bg-red-100",    label: "Muito Quente",   emoji: "🔴" },
};

export const SCORE_FACTOR_LABEL: Record<string, string> = {
  source:       "Origem",
  status:       "Status",
  engagement:   "Engajamento",
  recency:      "Recência",
  intent_price: "Perguntou sobre preço",
  intent_avail: "Perguntou sobre disponibilidade",
  has_phone:    "Telefone cadastrado",
  has_email:    "Email cadastrado",
  has_notes:    "Observações detalhadas",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function serviceError(base: string, raw: unknown, context: string) {
  const anyRaw = raw as { message?: string } | null;
  const msg =
    raw instanceof Error
      ? raw.message
      : typeof anyRaw?.message === "string"
      ? anyRaw.message
      : JSON.stringify(raw);
  return new Error(`${base} [context: ${context}]: ${msg}`);
}

// ── recalculateLeadScore ──────────────────────────────────────────────────────

/** Força recálculo via stored procedure e retorna o score resultante. */
export async function recalculateLeadScore(
  clinicId: string,
  leadId: string
): Promise<LeadScore> {
  if (!isValidUuid(clinicId)) throw new Error("clinic_id inválido.");
  if (!isValidUuid(leadId))   throw new Error("lead_id inválido.");

  const supabase = createClient();

  const { error: rpcError } = await supabase.rpc("calculate_lead_score", {
    p_lead_id:   leadId,
    p_clinic_id: clinicId,
    p_trigger:   "MANUAL_RECALC",
  });

  if (rpcError) {
    throw serviceError("Erro ao calcular score", rpcError, "calculate_lead_score");
  }

  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("score, score_label, score_factors, score_updated_at")
    .eq("id", leadId)
    .eq("clinic_id", clinicId)
    .single();

  if (fetchError || !lead) {
    throw serviceError("Erro ao ler score", fetchError, "leads.select_after_score");
  }

  return {
    score:     (lead as any).score     ?? 0,
    label:     ((lead as any).score_label  ?? "COLD") as ScoreLabel,
    factors:   (lead as any).score_factors ?? {},
    updatedAt: (lead as any).score_updated_at ?? null,
  };
}

// ── listLeadsByScore ──────────────────────────────────────────────────────────

/** Busca leads ativos ordenados por score decrescente. */
export async function listLeadsByScore(
  clinicId: string,
  options: {
    minScore?:    number;
    labelFilter?: ScoreLabel;
    limit?:       number;
  } = {}
): Promise<ScoredLeadRow[]> {
  if (!isValidUuid(clinicId)) return [];

  const supabase = createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .eq("clinic_id", clinicId)
    .is("deleted_at", null)
    .not("status", "in", "(CONVERTED,LOST)")
    .order("score", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.minScore !== undefined) {
    query = query.gte("score", options.minScore);
  }
  if (options.labelFilter) {
    query = query.eq("score_label", options.labelFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw serviceError("Erro ao listar leads por score", error, "listLeadsByScore");
  }

  return (data ?? []) as ScoredLeadRow[];
}

// ── getLeadScoreHistory ───────────────────────────────────────────────────────

export async function getLeadScoreHistory(
  clinicId: string,
  leadId: string
): Promise<ScoreHistoryEntry[]> {
  if (!isValidUuid(clinicId) || !isValidUuid(leadId)) return [];

  const supabase = createClient();

  const { data, error } = await supabase
    .from("lead_score_history")
    .select("score, score_label, score_factors, trigger_event, created_at")
    .eq("lead_id", leadId)
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw serviceError("Erro ao buscar histórico de score", error, "getLeadScoreHistory");
  }

  return (data ?? []) as ScoreHistoryEntry[];
}
