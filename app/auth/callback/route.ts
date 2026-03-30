import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Whitelist of allowed redirect prefixes after auth callback.
 * Prevents open redirect attacks via the `next` parameter.
 */
const ALLOWED_PREFIXES = ["/dashboard", "/reset-password", "/onboarding", "/subscription-expired"];

function sanitizeRedirect(raw: string | null): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;

  const trimmed = raw.trim();

  // Block empty, protocol-relative (//), absolute URLs (http:), and data/javascript URIs
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (/^\/[\\@]/.test(trimmed)) return fallback;
  if (/[:\s]/.test(trimmed)) return fallback;

  // Must match one of the allowed prefixes
  const isAllowed = ALLOWED_PREFIXES.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(prefix + "/") || trimmed.startsWith(prefix + "?")
  );

  return isAllowed ? trimmed : fallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Falha%20na%20autenticacao`
  );
}
