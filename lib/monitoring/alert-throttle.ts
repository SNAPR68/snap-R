/**
 * Alert Throttle
 * Prevents alert spam during cascading failures.
 * In-memory deduplication: max 1 alert per source per WINDOW_MS.
 */

const WINDOW_MS = 15 * 60_000; // 15 minutes

/** Map of source key → last alert timestamp */
const lastAlertTimes = new Map<string, number>();

/**
 * Check if an alert should be sent for this source.
 * Returns true if the alert is allowed (not throttled).
 */
export function shouldSendAlert(source: string): boolean {
  const now = Date.now();
  const lastSent = lastAlertTimes.get(source);

  if (lastSent && now - lastSent < WINDOW_MS) {
    return false; // Throttled — too recent
  }

  lastAlertTimes.set(source, now);
  return true;
}

/**
 * Reset throttle state (for testing).
 */
export function resetThrottle(): void {
  lastAlertTimes.clear();
}

/**
 * Get the throttle window in milliseconds (for testing).
 */
export function getThrottleWindowMs(): number {
  return WINDOW_MS;
}
