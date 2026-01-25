import { createClient } from '@supabase/supabase-js';

export function adminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );
}
