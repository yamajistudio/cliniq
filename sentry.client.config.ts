// Sentry client-side initialization.
// Importado automaticamente pelo Next.js via withSentryConfig em next.config.js.
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // % de transações capturadas para performance monitoring (0.0–1.0)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay: grava sessões com erros em produção
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      // Mascara PII automaticamente
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // Não logar no console do Sentry em dev para não poluir
  debug: false,

  // Não capturar se DSN não configurado (dev sem .env.local)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
