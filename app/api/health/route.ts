export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { checkCronHealth, type CronHealthStatus } from '@/lib/monitoring/cron-heartbeat';

interface HealthCheck {
  status: 'ok' | 'error';
  latency?: number;
}

async function timedCheck(
  name: string,
  checkFn: () => Promise<boolean>
): Promise<[string, HealthCheck]> {
  const start = Date.now();
  try {
    const ok = await checkFn();
    return [name, { status: ok ? 'ok' : 'error', latency: Date.now() - start }];
  } catch {
    return [name, { status: 'error', latency: Date.now() - start }];
  }
}

export async function GET() {
  const supabase = adminSupabase();

  // Run service checks in parallel
  const checkResults = await Promise.all([
    timedCheck('database', async () => {
      const { error } = await supabase.from('profiles').select('id').limit(1).single();
      // PGRST116 = no rows — that's fine, DB is reachable
      return !error || error.code === 'PGRST116';
    }),
    timedCheck('storage', async () => {
      const { error } = await supabase.storage.from('raw-images').list('', { limit: 1 });
      return !error;
    }),
    timedCheck('redis', async () => {
      // Only check if Upstash Redis is configured
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return true; // Not configured = not a failure
      }
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const pong = await redis.ping();
      return pong === 'PONG';
    }),
  ]);

  const checks: Record<string, HealthCheck> = {};
  for (const [name, result] of checkResults) {
    checks[name] = result;
  }

  // Check cron staleness
  let cronStatuses: CronHealthStatus[] = [];
  try {
    cronStatuses = await checkCronHealth();
    const overdueCrons = cronStatuses.filter(c => c.isOverdue);
    const failedCrons = cronStatuses.filter(c => c.lastStatus === 'error');
    checks.crons = { status: overdueCrons.length === 0 && failedCrons.length === 0 ? 'ok' : 'error' };
  } catch {
    checks.crons = { status: 'error' };
  }

  const allOk = Object.values(checks).every(v => v.status === 'ok');
  const responseStatus = allOk || process.env.NODE_ENV !== 'production' ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      crons: cronStatuses.length > 0 ? cronStatuses : undefined,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    },
    { status: responseStatus }
  );
}
