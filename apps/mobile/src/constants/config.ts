/**
 * App configuration
 * Environment-specific values for Supabase and API connections
 */

// Supabase configuration
// These match the web app's NEXT_PUBLIC_ env vars
export const SUPABASE_URL = 'https://asoiwonhqoesbvcilqwd.supabase.co';
export const SUPABASE_ANON_KEY = ''; // Will be set from environment

// API base URL (Next.js on Vercel)
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://snapr.ai';

// OAuth redirect scheme
export const OAUTH_REDIRECT_SCHEME = 'snapr';

// Polling intervals (ms)
export const POLL_PREPARATION_STATUS = 5000;
export const POLL_MARKETING_STATUS = 5000;
export const DASHBOARD_REFRESH = 30000;

// Upload constraints (matching web app)
export const MAX_UPLOAD_FILES = 50;
export const MAX_FILE_SIZE_MB = 25;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];
