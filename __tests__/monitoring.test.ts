import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldSendAlert, resetThrottle, getThrottleWindowMs } from '@/lib/monitoring/alert-throttle';

// ============================================
// Alert Throttle Tests
// ============================================
describe('Alert Throttle', () => {
  beforeEach(() => {
    resetThrottle();
  });

  it('allows first alert for a source', () => {
    expect(shouldSendAlert('test-source')).toBe(true);
  });

  it('blocks duplicate alert within throttle window', () => {
    expect(shouldSendAlert('test-source')).toBe(true);
    expect(shouldSendAlert('test-source')).toBe(false);
  });

  it('allows alerts from different sources', () => {
    expect(shouldSendAlert('source-a')).toBe(true);
    expect(shouldSendAlert('source-b')).toBe(true);
  });

  it('allows alert after throttle window expires', () => {
    const realNow = Date.now;
    let mockTime = 1000000;
    Date.now = () => mockTime;

    expect(shouldSendAlert('test-source')).toBe(true);
    expect(shouldSendAlert('test-source')).toBe(false);

    // Advance past throttle window
    mockTime += getThrottleWindowMs() + 1;
    expect(shouldSendAlert('test-source')).toBe(true);

    Date.now = realNow;
  });

  it('throttle window is 15 minutes', () => {
    expect(getThrottleWindowMs()).toBe(15 * 60 * 1000);
  });

  it('reset clears all throttle state', () => {
    shouldSendAlert('source-a');
    shouldSendAlert('source-b');
    resetThrottle();
    expect(shouldSendAlert('source-a')).toBe(true);
    expect(shouldSendAlert('source-b')).toBe(true);
  });
});

// ============================================
// Slack Alert Tests
// ============================================
describe('Slack Alert', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('no-ops when SLACK_ALERT_WEBHOOK_URL is not set', async () => {
    delete process.env.SLACK_ALERT_WEBHOOK_URL;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const { sendSlackAlert } = await import('@/lib/monitoring/slack-alert');
    await sendSlackAlert('test', 'test message');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends POST to Slack webhook when configured', async () => {
    process.env.SLACK_ALERT_WEBHOOK_URL = 'https://hooks.slack.com/test';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));

    // Need to re-import to pick up env change
    const mod = await import('@/lib/monitoring/slack-alert');
    await mod.sendSlackAlert('test-source', 'Something broke', { key: 'value' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://hooks.slack.com/test');
    expect(options?.method).toBe('POST');

    const body = JSON.parse(options?.body as string);
    expect(body.blocks).toBeDefined();
    expect(body.blocks[0].text.text).toContain('test-source');
  });

  it('does not throw on fetch failure', async () => {
    process.env.SLACK_ALERT_WEBHOOK_URL = 'https://hooks.slack.com/test';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const mod = await import('@/lib/monitoring/slack-alert');
    // Should not throw
    await expect(mod.sendSlackAlert('test', 'msg')).resolves.toBeUndefined();
  });
});

// ============================================
// Cron Heartbeat Tests (unit — no DB)
// ============================================
describe('Cron Heartbeat', () => {
  it('startCronHeartbeat returns succeed and fail callbacks', async () => {
    // Mock adminSupabase to avoid real DB calls
    vi.mock('@/lib/supabase/admin', () => ({
      adminSupabase: () => ({
        from: () => ({
          insert: () => Promise.resolve({ error: null }),
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          }),
        }),
      }),
    }));

    const { startCronHeartbeat } = await import('@/lib/monitoring/cron-heartbeat');
    const heartbeat = startCronHeartbeat('test-cron');

    expect(heartbeat).toHaveProperty('succeed');
    expect(heartbeat).toHaveProperty('fail');
    expect(typeof heartbeat.succeed).toBe('function');
    expect(typeof heartbeat.fail).toBe('function');

    // Should not throw
    await heartbeat.succeed({ test: true });
    await heartbeat.fail(new Error('test error'));
  });
});
