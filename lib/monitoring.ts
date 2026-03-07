import { logger } from '@/lib/logger';
// Monitoring and Error Tracking Utilities

interface ErrorContext {
  userId?: string;
  endpoint?: string;
  action?: string;
  [key: string]: unknown;
}

// Log error to database and console
export async function logError(
  error: Error | string,
  context: ErrorContext = {}
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error('[ERROR]', {
    message: errorMessage,
    stack: errorStack,
    ...context,
    timestamp: new Date().toISOString(),
  });

  // Log to database via API (non-blocking)
  try {
          signal: AbortSignal.timeout(10000),
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message: errorMessage,
        context: { ...context, stack: errorStack },
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error: unknown) {
    logger.error('Failed to log error to database:', error);
  }
}

// Log warning
export async function logWarning(
  message: string,
  context: ErrorContext = {}
): Promise<void> {
  logger.warn('[WARNING]', { message, ...context, timestamp: new Date().toISOString() });

  try {
          signal: AbortSignal.timeout(10000),
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'warning', message, context }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error: unknown) {
    logger.error('Failed to log warning:', error);
  }
}

// Track API costs
export async function trackApiCost(
  provider: string,
  operation: string,
  cost: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
          signal: AbortSignal.timeout(10000),
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'api_cost',
        provider,
        operation,
        cost,
        metadata,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (error: unknown) {
    logger.error('Failed to track API cost:', error);
  }
}

// Performance timing
export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

// Health check data
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail';
    latency?: number;
    message?: string;
  }[];
  timestamp: string;
}
