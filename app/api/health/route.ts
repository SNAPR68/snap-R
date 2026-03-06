export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database connectivity check
  try {
    const supabase = adminSupabase();
    const { error } = await supabase.from('profiles').select('id').limit(1).single();
    // PGRST116 = no rows — that's fine, DB is reachable
    checks.database = (!error || error.code === 'PGRST116') ? 'ok' : 'error';
  } catch {
    checks.database = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    },
    { status: allOk ? 200 : 503 }
  );
}
