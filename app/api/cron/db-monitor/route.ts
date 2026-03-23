/**
 * GET /api/cron/db-monitor
 * Runs daily at 6am — monitors database health.
 * Checks: slow queries, connection pool, table bloat.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseHealthCheck } from '@/lib/monitoring/db-monitor';
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat';
import { logger } from '@/lib/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const heartbeat = startCronHeartbeat('db-monitor');

  try {
    const result = await runDatabaseHealthCheck();

    if (result.healthy) {
      logger.info('[DB Monitor] Database healthy');
    } else {
      logger.warn('[DB Monitor] Issues detected:', result.alerts);
    }

    await heartbeat.succeed({
      healthy: result.healthy,
      alerts_count: result.alerts.length,
      slow_queries: result.slowQueries.length,
    });

    return NextResponse.json({
      success: true,
      healthy: result.healthy,
      alerts: result.alerts,
      slowQueries: result.slowQueries.length,
      connections: result.connections,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DB Monitor] Fatal error:', message);
    await heartbeat.fail(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
