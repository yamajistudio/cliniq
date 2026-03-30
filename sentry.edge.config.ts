// Sentry Edge Runtime initialization (Next.js Middleware, Edge API routes).
// Importado pelo instrumentation.ts.
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Edge runtime tem restrições — sem performance tracing pesado
  tracesSampleRate: 0,

  debug: false,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
