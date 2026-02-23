export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

export async function GET() {
  const timestamp = new Date().toISOString();

  // Check Supabase connectivity
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    const supabase = adminSupabase();
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    dbLatencyMs = Date.now() - start;

    if (error) {
      dbStatus = 'error';
    }
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  const httpStatus = dbStatus === 'ok' ? 200 : 503;

  return NextResponse.json(
    {
      status,
      timestamp,
      version: '1.0.0',
      checks: {
        database: { status: dbStatus, latencyMs: dbLatencyMs },
      },
    },
    { status: httpStatus }
  );
}
