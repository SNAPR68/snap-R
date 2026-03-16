/**
 * GET /api/cron/health-check
 * Runs hourly — watchdog that checks system health and alerts on problems.
 * Checks: database, storage, Redis, cron staleness.
 * Sends alerts via email + Slack if any check fails.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { adminSupabase } from '@/lib/supabase/admin';
import { checkCronHealth } from '@/lib/monitoring/cron-heartbeat';
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat';
import { logCritical } from '@/lib/error-logger';
import { logger } from '@/lib/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const heartbeat = startCronHeartbeat('health-check');
  const issues: string[] = [];

  // Sentry cron monitoring check-in
  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: 'health-check', status: 'in_progress' },
    { schedule: { type: 'crontab', value: '0 * * * *' }, checkinMargin: 5, maxRuntime: 5 },
  );

  try {
    // 1. Database check
    try {
      const supabase = adminSupabase();
      const { error } = await supabase.from('profiles').select('id').limit(1).single();
      if (error && error.code !== 'PGRST116') {
        issues.push(`Database: ${error.message}`);
      }
    } catch (dbErr: unknown) {
      issues.push(`Database: ${dbErr instanceof Error ? dbErr.message : 'unreachable'}`);
    }

    // 2. Storage check
    try {
      const supabase = adminSupabase();
      const { error } = await supabase.storage.from('raw-images').list('', { limit: 1 });
      if (error) {
        issues.push(`Storage: ${error.message}`);
      }
    } catch (stErr: unknown) {
      issues.push(`Storage: ${stErr instanceof Error ? stErr.message : 'unreachable'}`);
    }

    // 3. Redis check (only if configured)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        const pong = await redis.ping();
        if (pong !== 'PONG') {
          issues.push('Redis: unexpected ping response');
        }
      } catch (redisErr: unknown) {
        issues.push(`Redis: ${redisErr instanceof Error ? redisErr.message : 'unreachable'}`);
      }
    }

    // 4. Cron staleness check
    try {
      const cronStatuses = await checkCronHealth();
      const overdueCrons = cronStatuses.filter(c => c.isOverdue);
      const failedCrons = cronStatuses.filter(c => c.lastStatus === 'error');

      for (const cron of overdueCrons) {
        const overdueMinutes = cron.overdueBy ? Math.round(cron.overdueBy / 60_000) : 0;
        issues.push(`Cron overdue: ${cron.name} (${overdueMinutes}m late, schedule: ${cron.label})`);
      }
      for (const cron of failedCrons) {
        issues.push(`Cron failed: ${cron.name} (last run: ${cron.lastRun})`);
      }
    } catch {
      issues.push('Cron health check failed');
    }

    // Send alerts if any issues found
    if (issues.length > 0) {
      logger.error('[HealthCheck] Issues detected:', issues);
      await logCritical('health-check', `${issues.length} issue(s) detected`, {
        issues,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.info('[HealthCheck] All systems healthy');
    }

    await heartbeat.succeed({ issues_count: issues.length, issues });
    Sentry.captureCheckIn({ checkInId, monitorSlug: 'health-check', status: 'ok' });
    return NextResponse.json({
      success: true,
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[HealthCheck] Fatal error:', message);
    await heartbeat.fail(error);
    Sentry.captureCheckIn({ checkInId, monitorSlug: 'health-check', status: 'error' });
    Sentry.captureException(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
