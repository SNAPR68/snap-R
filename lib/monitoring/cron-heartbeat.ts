/**
 * Cron Heartbeat System
 * Tracks cron job execution and detects staleness.
 *
 * Usage in cron routes:
 *   const heartbeat = startCronHeartbeat('publish-scheduled');
 *   try { ... your cron logic ... heartbeat.succeed(results); }
 *   catch (error) { heartbeat.fail(error); throw error; }
 */

import { adminSupabase } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/** Expected schedule intervals (ms) with generous buffers */
const CRON_SCHEDULES: Record<string, { intervalMs: number; label: string }> = {
  'publish-scheduled': { intervalMs: 15 * 60_000, label: 'Every 15 min' },
  'sync-analytics': { intervalMs: 6 * 3600_000, label: 'Every 6 hours' },
  'refresh-tokens': { intervalMs: 4 * 3600_000, label: 'Every 4 hours' },
  'daily-digest': { intervalMs: 24 * 3600_000, label: 'Daily 8am' },
  'drip-sequences': { intervalMs: 1 * 3600_000, label: 'Every hour' },
  'usage-check': { intervalMs: 24 * 3600_000, label: 'Daily 9am' },
  'health-check': { intervalMs: 1 * 3600_000, label: 'Every hour' },
};

/** Staleness buffer: 2× the expected interval before flagging overdue */
const STALENESS_MULTIPLIER = 2;

export interface CronHeartbeat {
  succeed: (results?: Record<string, unknown>) => Promise<void>;
  fail: (error: unknown) => Promise<void>;
}

/**
 * Start tracking a cron run. Returns succeed/fail callbacks.
 */
export function startCronHeartbeat(cronName: string): CronHeartbeat {
  const startedAt = Date.now();

  const record = async (
    level: 'info' | 'error',
    message: string,
    extra?: Record<string, unknown>
  ) => {
    const durationMs = Date.now() - startedAt;
    try {
      const supabase = adminSupabase();
      await supabase.from('system_logs').insert({
        level,
        source: `cron:${cronName}`,
        message,
        metadata: {
          cron_name: cronName,
          duration_ms: durationMs,
          started_at: new Date(startedAt).toISOString(),
          environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
          ...extra,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      logger.error(`[CronHeartbeat] Failed to record heartbeat for ${cronName}`);
    }
  };

  return {
    succeed: async (results?: Record<string, unknown>) => {
      await record('info', 'Cron completed', { results });
      logger.info(`[CronHeartbeat] ${cronName} completed in ${Date.now() - startedAt}ms`);
    },
    fail: async (error: unknown) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      await record('error', 'Cron failed', { error: errMsg, stack });
      logger.error(`[CronHeartbeat] ${cronName} failed after ${Date.now() - startedAt}ms: ${errMsg}`);
    },
  };
}

export interface CronHealthStatus {
  name: string;
  label: string;
  lastRun: string | null;
  lastStatus: 'ok' | 'error' | 'never';
  isOverdue: boolean;
  overdueBy?: number;
}

/**
 * Check health of all registered crons by querying last heartbeat.
 * Returns per-cron status with overdue detection.
 */
export async function checkCronHealth(): Promise<CronHealthStatus[]> {
  const results: CronHealthStatus[] = [];

  try {
    const supabase = adminSupabase();
    const cronNames = Object.keys(CRON_SCHEDULES);

    // Query the most recent heartbeat for each cron
    for (const name of cronNames) {
      const schedule = CRON_SCHEDULES[name];
      const { data } = await supabase
        .from('system_logs')
        .select('level, created_at')
        .eq('source', `cron:${name}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        results.push({
          name,
          label: schedule.label,
          lastRun: null,
          lastStatus: 'never',
          isOverdue: false, // Can't be overdue if never ran (new deploy)
        });
        continue;
      }

      const lastRunAt = new Date(data.created_at).getTime();
      const staleCutoff = Date.now() - schedule.intervalMs * STALENESS_MULTIPLIER;
      const isOverdue = lastRunAt < staleCutoff;

      results.push({
        name,
        label: schedule.label,
        lastRun: data.created_at,
        lastStatus: data.level === 'error' ? 'error' : 'ok',
        isOverdue,
        ...(isOverdue ? { overdueBy: Date.now() - lastRunAt } : {}),
      });
    }
  } catch {
    logger.error('[CronHeartbeat] Failed to check cron health');
  }

  return results;
}
