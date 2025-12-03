import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization - only create clients when called, not at module load time
let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseAnon) {
      throw new Error('Supabase environment variables are not set');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnon);
  }
  return supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase admin environment variables are not set');
    }
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdminClient;
}

// Legacy exports with lazy getters - only initialize when accessed
// This prevents build-time execution while maintaining backward compatibility
function createLazyExport<T extends object>(getter: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      return (getter() as any)[prop];
    },
  });
}

export const supabase = createLazyExport(() => getSupabase());
export const supabaseAdmin = createLazyExport(() => getSupabaseAdmin());



