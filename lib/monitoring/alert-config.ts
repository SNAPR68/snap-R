export const ALERT_THRESHOLDS = {
  /** Error rate spike: trigger if > 5% errors in a 5-minute window */
  errorRateSpike: { percent: 5, windowMinutes: 5 },
  /** API latency p95 threshold in ms */
  apiLatencyP95: 5000,
  /** Cron overdue multiplier: 2x expected interval before flagging */
  cronOverdueMultiplier: 2,
  /** DB slow query threshold in ms */
  dbSlowQueryThreshold: 1000,
  /** DB connection pool max utilization percent */
  dbConnectionPoolMax: 80,
} as const;

export const ALERT_ROUTES: Record<string, { perUserLimit: number; windowMs: number }> = {
  '/api/enhance': { perUserLimit: 10, windowMs: 60000 },
  '/api/batch-enhance': { perUserLimit: 3, windowMs: 60000 },
  '/api/chat': { perUserLimit: 20, windowMs: 60000 },
  '/api/copy/caption': { perUserLimit: 15, windowMs: 60000 },
  '/api/copy/hashtags': { perUserLimit: 15, windowMs: 60000 },
  '/api/ai/generate-caption': { perUserLimit: 15, windowMs: 60000 },
  '/api/ai/generate-description': { perUserLimit: 10, windowMs: 60000 },
  '/api/video/generate': { perUserLimit: 5, windowMs: 60000 },
  '/api/staging': { perUserLimit: 5, windowMs: 60000 },
  '/api/renovation': { perUserLimit: 5, windowMs: 60000 },
  '/api/floor-plans/generate': { perUserLimit: 5, windowMs: 60000 },
  '/api/admin/listings/[id]/preparation': { perUserLimit: 3, windowMs: 60000 },
};
