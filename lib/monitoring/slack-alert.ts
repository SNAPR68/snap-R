/**
 * Slack Webhook Alerting
 * Sends critical alerts to a Slack channel via incoming webhook.
 * Gracefully no-ops if SLACK_ALERT_WEBHOOK_URL is not configured.
 */

import { logger } from '@/lib/logger';

/**
 * Send a critical alert to Slack.
 * No-ops if SLACK_ALERT_WEBHOOK_URL env var is not set.
 */
export async function sendSlackAlert(
  source: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.SLACK_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
    const timestamp = new Date().toISOString();

    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 CRITICAL: ${source}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Environment:*\n${environment}` },
            { type: 'mrkdwn', text: `*Time:*\n${timestamp}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${message}`,
          },
        },
        ...(metadata
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Details:*\n\`\`\`${JSON.stringify(metadata, null, 2).slice(0, 2000)}\`\`\``,
                },
              },
            ]
          : []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Logs' },
              url: 'https://snap-r.com/admin/logs',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'System Status' },
              url: 'https://snap-r.com/admin/status',
            },
          ],
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[SlackAlert] Failed to send: ${errMsg}`);
  }
}
