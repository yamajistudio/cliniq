/**
 * Logger estruturado centralizado.
 *
 * Em produção emite JSON puro para ingestão por Axiom, Datadog ou Sentry.
 * Em desenvolvimento emite texto legível com contexto formatado.
 *
 * USO:
 *   import { logger } from '@/lib/logger';
 *
 *   logger.info('Paciente criado', { clinicId, userId, patientId });
 *   logger.error('Falha ao salvar', err, { clinicId });
 *
 * Seguro em Server Components, Server Actions, Edge Middleware e Client Components.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  clinicId?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: { message: string; stack?: string; code?: string };
  [key: string]: unknown;
}

function log(
  level: LogLevel,
  message: string,
  context: Omit<LogEntry, 'level' | 'message' | 'timestamp'> = {}
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (process.env.NODE_ENV === 'production') {
    // JSON puro para ingestão por Axiom / Datadog / Sentry
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
  } else {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase().padEnd(5)}]`;
    const ctx = Object.keys(context).length
      ? '\n' + JSON.stringify(context, null, 2)
      : '';
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}${ctx}`);
  }
}

export const logger = {
  debug(msg: string, ctx?: object): void {
    log('debug', msg, ctx);
  },

  info(msg: string, ctx?: object): void {
    log('info', msg, ctx);
  },

  warn(msg: string, ctx?: object): void {
    log('warn', msg, ctx);
  },

  /**
   * Registra um erro. Aceita instância de Error ou qualquer valor.
   *
   * @example
   * logger.error('Falha ao criar paciente', err, { clinicId, userId });
   */
  error(msg: string, error?: unknown, ctx?: object): void {
    const errorInfo =
      error instanceof Error
        ? { message: error.message, stack: error.stack, code: (error as NodeJS.ErrnoException).code }
        : error !== undefined
        ? { message: String(error) }
        : undefined;

    log('error', msg, { ...ctx, ...(errorInfo ? { error: errorInfo } : {}) });
  },
};
