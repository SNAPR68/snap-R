/**
 * Environment Variable Validation
 * ================================
 * Fast-fail validation that checks required env vars on boot.
 * Called from instrumentation.ts register() in Node.js runtime.
 */

const REQUIRED_VARS = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  stripe: ['STRIPE_SECRET_KEY'],
  app: ['NEXT_PUBLIC_BASE_URL'],
} as const;

const RECOMMENDED_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'NEXT_PUBLIC_SENTRY_DSN',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [category, vars] of Object.entries(REQUIRED_VARS)) {
    for (const v of vars) {
      if (!process.env[v]) missing.push(`${v} (${category})`);
    }
  }

  for (const v of RECOMMENDED_VARS) {
    if (!process.env[v]) warnings.push(v);
  }

  if (warnings.length > 0) {
    console.warn(`[env] Missing recommended vars: ${warnings.join(', ')}`);
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables:\n  ${missing.join('\n  ')}`
    );
  }
}
