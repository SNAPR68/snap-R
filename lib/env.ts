/**
 * Environment Variable Validation
 * ================================
 * Fast-fail validation that checks required env vars on boot.
 * Called from instrumentation.ts register() in Node.js runtime.
 */

const REQUIRED_VARS = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  stripe: ['STRIPE_SECRET_KEY'],
  app: ['CRON_SECRET'],
  worker: ['WORKER_URL'],
  social: [
    'NEXT_PUBLIC_FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'NEXT_PUBLIC_LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET',
  ],
  notifications: [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_SMS_FROM',
    'TWILIO_WHATSAPP_FROM',
  ],
} as const;

const RECOMMENDED_VARS = [
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
  'NEXT_PUBLIC_TIKTOK_CLIENT_KEY',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'NEXT_PUBLIC_TWITTER_CLIENT_ID',
  'ELEVENLABS_API_KEY',
  'REVENUECAT_API_KEY',
  'REVENUECAT_WEBHOOK_AUTH_KEY',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [category, vars] of Object.entries(REQUIRED_VARS)) {
    for (const v of vars) {
      if (!process.env[v]) missing.push(`${v} (${category})`);
    }
  }

  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_BASE_URL) {
    missing.push('NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL (app)');
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
