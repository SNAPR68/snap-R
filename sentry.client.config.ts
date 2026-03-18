// Client-side Sentry initialization is handled by instrumentation-client.ts
// This file must exist for @sentry/nextjs but should NOT call Sentry.init()
// to avoid duplicate Session Replay instances.
