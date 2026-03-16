// Sentry Cron Monitoring integration.
// Wraps cron route handlers with Sentry.withMonitor() for automatic
// check-in/check-out and missed job alerting in Sentry.
//
// Usage:
//   import { withSentryCron } from '@/lib/monitoring/sentry-cron';
//   export const POST = withSentryCron('publish-scheduled', '*/15 * * * *', handler);

import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

type CronHandler = (request: NextRequest) => Promise<NextResponse>;

/**
 * Wraps a cron route handler with Sentry cron monitoring.
 * Sends check_in (in_progress) at start and check_in (ok/error) at end.
 * If the DSN is not configured, falls through to the raw handler.
 */
export function withSentryCron(
  monitorSlug: string,
  schedule: string,
  handler: CronHandler,
): CronHandler {
  return async (request: NextRequest) => {
    // If Sentry is not configured, just run the handler
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return handler(request);
    }

    const checkInId = Sentry.captureCheckIn(
      {
        monitorSlug,
        status: 'in_progress',
      },
      {
        schedule: {
          type: 'crontab',
          value: schedule,
        },
        checkinMargin: 5, // 5 min window for check-in
        maxRuntime: 5, // 5 min max runtime before flagging
      },
    );

    try {
      const result = await handler(request);

      Sentry.captureCheckIn({
        checkInId,
        monitorSlug,
        status: 'ok',
      });

      return result;
    } catch (error: unknown) {
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug,
        status: 'error',
      });

      Sentry.captureException(error);
      throw error;
    }
  };
}
