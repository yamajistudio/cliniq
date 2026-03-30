import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Route config ─────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"];
const SUBSCRIPTION_EXEMPT = ["/dashboard/settings", "/subscription-expired", "/dashboard/onboarding"];
const ERROR_PAGE = "/subscription-expired";

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/app");
}

function isSubscriptionExempt(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT.some((r) => pathname === r || pathname.startsWith(r));
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser() to refresh session — never use getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Public routes: redirect to dashboard if already logged in ──────────
  if (isPublicRoute(pathname)) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── Protected routes: redirect to login if not authenticated ───────────
  if (isProtectedRoute(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // ── Subscription check (FAIL-CLOSED) ─────────────────────────────────
    if (!isSubscriptionExempt(pathname)) {
      try {
        // Single optimized query: join memberships + subscriptions
        const { data: membership } = await supabase
          .from("clinic_memberships")
          .select("clinic_id")
          .eq("user_id", user.id)
          .eq("status", "ACTIVE")
          .limit(1)
          .maybeSingle();

        if (membership?.clinic_id) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("status, trial_end, expires_at")
            .eq("clinic_id", membership.clinic_id)
            .maybeSingle();

          if (subscription) {
            const now = new Date();
            const isTrial = subscription.status === "TRIAL";
            const trialExpired =
              isTrial &&
              subscription.trial_end &&
              new Date(subscription.trial_end) < now;
            const subExpired =
              subscription.expires_at &&
              new Date(subscription.expires_at) < now;
            const statusExpired =
              subscription.status === "EXPIRED" ||
              subscription.status === "CANCELLED";

            if (trialExpired || subExpired || statusExpired) {
              const url = request.nextUrl.clone();
              url.pathname = ERROR_PAGE;
              return NextResponse.redirect(url);
            }
          }
          // No subscription row = newly onboarding, allow through
        }
        // No membership = new user, allow through to onboarding
      } catch {
        // ── FAIL-CLOSED: if subscription check fails, block access ───────
        // Do NOT allow access on error — redirect to safe page
        const url = request.nextUrl.clone();
        url.pathname = ERROR_PAGE;
        url.searchParams.set("error", "subscription_check_failed");
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
