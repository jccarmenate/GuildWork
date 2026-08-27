import * as Sentry from "@sentry/node";

let initialized = false;

// No-ops unless SENTRY_DSN is set, so this is safe to call in every
// environment (including tests) without requiring an account.
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, environment: process.env.NODE_ENV ?? "development", tracesSampleRate: 0.1 });
  initialized = true;
}

export function captureException(err: unknown): void {
  if (initialized) Sentry.captureException(err);
}
