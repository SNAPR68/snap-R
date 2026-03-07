/**
 * Webhook event dispatcher
 *
 * Sends outgoing webhook notifications to all matching subscriber endpoints.
 * Called from status-hook, lead creation, post publishing, etc.
 *
 * Retry policy: 3 attempts with exponential backoff (1s, 4s, 16s).
 * Only retries on network errors or 5xx server errors; 4xx are final failures.
 *
 * Supported events:
 *   listing.created, listing.prepared, listing.marketing_complete
 *   lead.created, lead.status_changed
 *   post.published, post.scheduled
 *   open_house.checkin
 */

import { createHmac } from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'

import { logger } from '@/lib/logger';
interface OutgoingWebhook {
  id: string
  url: string
  secret: string | null
  events: string[]
}

/** Retry configuration */
const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 1000 // 1s → 4s → 16s (base * 4^attempt)

/**
 * Dispatches a webhook event to all active subscribers whose events array
 * contains the given event name.
 *
 * This function never throws -- delivery failures are logged to the
 * `webhook_deliveries` table and silently continued past.
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = adminSupabase()

  // Fetch active webhooks for this user that subscribe to this event
  const { data: webhooks, error: fetchError } = await supabase
    .from('outgoing_webhooks')
    .select('id, url, secret, events')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event])

  if (fetchError) {
    logger.error('[Webhooks] Error fetching webhooks:', fetchError.message)
    return
  }

  if (!webhooks || webhooks.length === 0) return

  const typedWebhooks = webhooks as OutgoingWebhook[]

  // Dispatch to all matching webhooks concurrently
  await Promise.allSettled(
    typedWebhooks.map((webhook) => deliverWithRetry(supabase, webhook, event, payload))
  )
}

/**
 * Delivers with up to MAX_ATTEMPTS retries using exponential backoff.
 * Only retries on network errors or 5xx status codes.
 */
async function deliverWithRetry(
  supabase: ReturnType<typeof adminSupabase>,
  webhook: OutgoingWebhook,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const body = JSON.stringify({
    event,
    data: payload,
    timestamp: new Date().toISOString(),
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'SnapR-Webhooks/1.0',
  }

  // Sign the payload with HMAC-SHA256 if a secret is configured
  if (webhook.secret) {
    const signature = createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex')
    headers['X-SnapR-Signature'] = signature
  }

  let statusCode: number | null = null
  let responseBody: string | null = null
  let success = false
  let attempts = 0

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    attempts = attempt + 1

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      })

      statusCode = response.status
      success = response.ok

      // Read a limited amount of the response for logging
      try {
        responseBody = (await response.text()).slice(0, 2000)
      } catch {
        responseBody = null
      }

      // Success or client error (4xx) — don't retry
      if (response.ok || (statusCode >= 400 && statusCode < 500)) {
        break
      }

      // Server error (5xx) — retry with backoff
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = BASE_DELAY_MS * Math.pow(4, attempt) // 1s, 4s, 16s
        await sleep(delay)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown delivery error'
      responseBody = message

      // Network error — retry with backoff
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = BASE_DELAY_MS * Math.pow(4, attempt)
        logger.warn(`[Webhooks] Attempt ${attempt + 1}/${MAX_ATTEMPTS} failed for ${webhook.url}: ${message}, retrying in ${delay}ms`)
        await sleep(delay)
      } else {
        logger.error(`[Webhooks] All ${MAX_ATTEMPTS} attempts failed for ${webhook.url}: ${message}`)
      }
    }
  }

  // Log final delivery result — never throw on logging failure
  try {
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event,
      payload,
      status_code: statusCode,
      response_body: responseBody,
      success,
      attempts,
    })
  } catch (logErr: unknown) {
    const msg = logErr instanceof Error ? logErr.message : 'Unknown error'
    logger.error('[Webhooks] Failed to log delivery:', msg)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
