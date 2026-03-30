/** @type {import('next').NextConfig} */

const { withSentryConfig } = require("@sentry/nextjs");

// Extrai hostname do Supabase para CSP dinâmico
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "*.supabase.co";

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // P0 FIX: TypeScript errors MUST break the build in production
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: https://${supabaseHostname}`,
              `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname} https://*.sentry.io`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

// ── Sentry webpack plugin options ────────────────────────────────────────────
// Veja todos os parâmetros em https://github.com/getsentry/sentry-webpack-plugin#options

module.exports = withSentryConfig(nextConfig, {
  // Org e projeto Sentry (necessários para upload de source maps)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? "crm-clinicas",

  // Silencia o log do plugin no build para não poluir o output
  silent: !process.env.CI,

  // Upload de source maps em produção (requer SENTRY_AUTH_TOKEN)
  // Desativado automaticamente se a variável não estiver configurada
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Oculta source maps do bundle client (source maps só no Sentry)
  hideSourceMaps: true,

  // Disable o tunnel route (evita tracking blockers interceptarem erros)
  // Descomente se precisar: tunnelRoute: "/monitoring-tunnel",

  // Não adicionar instrumentation automática de Server Components
  // para evitar overhead em produção — usamos instrumentation.ts manual
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});
