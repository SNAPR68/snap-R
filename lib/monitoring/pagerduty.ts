type PagerDutySeverity = 'critical' | 'error' | 'warning' | 'info';

interface PagerDutyEvent {
  severity: PagerDutySeverity;
  summary: string;
  source?: string;
  component?: string;
  details?: Record<string, unknown>;
}

/**
 * Trigger a PagerDuty alert via Events API v2.
 * No-ops gracefully when PAGERDUTY_ROUTING_KEY is not configured.
 */
export async function triggerPagerDuty(event: PagerDutyEvent): Promise<boolean> {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    console.warn('[PagerDuty] PAGERDUTY_ROUTING_KEY not configured, skipping alert');
    return false;
  }

  try {
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        payload: {
          summary: event.summary,
          severity: event.severity,
          source: event.source || 'snapr-app',
          component: event.component,
          custom_details: event.details,
          timestamp: new Date().toISOString(),
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    return response.ok;
  } catch {
    console.error('[PagerDuty] Failed to send alert');
    return false;
  }
}
