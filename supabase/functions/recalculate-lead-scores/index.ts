/**
 * Edge Function: recalculate-lead-scores
 *
 * Recalcula o score de todos os leads ativos cujo score_updated_at é nulo
 * ou mais antigo que 1 hora. Projetado para execução via pg_cron a cada hora.
 *
 * pg_cron setup (run once in SQL editor):
 *   select cron.schedule(
 *     'recalc-lead-scores',
 *     '0 * * * *',
 *     $$
 *       select net.http_post(
 *         url     := 'https://<project-ref>.supabase.co/functions/v1/recalculate-lead-scores',
 *         headers := jsonb_build_object('Authorization', 'Bearer <service_role_key>')
 *       )
 *     $$
 *   );
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE   = 10;
const STALE_HOURS  = 1;

type LeadStub = { id: string; clinic_id: string };

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── 1. Find stale leads ───────────────────────────────────────────────────
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: staleLeads, error: queryError } = await supabase
    .from("leads")
    .select("id, clinic_id")
    .is("deleted_at", null)
    .not("status", "in", "(CONVERTED,LOST)")
    .or(`score_updated_at.is.null,score_updated_at.lt.${staleThreshold}`);

  if (queryError) {
    console.error("[recalculate-lead-scores] Query error:", queryError.message);
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const leads = (staleLeads ?? []) as LeadStub[];

  if (leads.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, processed: 0, message: "No stale leads found" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`[recalculate-lead-scores] Processing ${leads.length} stale leads`);

  // ── 2. Process in batches ─────────────────────────────────────────────────
  let processed = 0;
  let failed    = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(({ id, clinic_id }) =>
        supabase.rpc("calculate_lead_score", {
          p_lead_id:   id,
          p_clinic_id: clinic_id,
          p_trigger:   "SCHEDULED_RECALC",
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.error) {
          console.warn(
            "[recalculate-lead-scores] RPC error:",
            result.value.error.message
          );
          failed++;
        } else {
          processed++;
        }
      } else {
        console.error(
          "[recalculate-lead-scores] Unexpected error:",
          result.reason
        );
        failed++;
      }
    }
  }

  console.log(
    `[recalculate-lead-scores] Done — processed: ${processed}, failed: ${failed}`
  );

  return new Response(
    JSON.stringify({ ok: true, processed, failed, total: leads.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
