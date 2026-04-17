/**
 * Environment Variable Validation
 * ================================
 * Fast-fail validation that checks required env vars on boot.
 * Called from instrumentation.ts register() in Node.js runtime.
 */

// Strict required vars — their absence crashes every request at boot.
// Keep this list minimal. Vars that the app can gracefully no-op without
// (social OAuth, Twilio, TikTok, Twitter, ElevenLabs, RevenueCat, etc.)
// belong in RECOMMENDED_VARS so they only warn.
const REQUIRED_VARS = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  stripe: ['STRIPE_SECRET_KEY'],
  app: ['CRON_SECRET'],
  worker: ['WORKER_URL'],
} as const;

// Missing → console.warn only. Features that depend on them should check
// capability at call-time (see lib/social/capabilities.ts) and return a
// graceful 503/skip instead of crashing boot.
const RECOMMENDED_VARS = [
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  // Social OAuth — capability system gates these at runtime
  'NEXT_PUBLIC_FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'NEXT_PUBLIC_LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
  'NEXT_PUBLIC_TIKTOK_CLIENT_KEY',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'NEXT_PUBLIC_TWITTER_CLIENT_ID',
  // Notifications — sender returns "Not configured" when missing
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_SMS_FROM',
  'TWILIO_WHATSAPP_FROM',
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
