/**
 * Webhook event dispatcher
 *
 * Sends outgoing webhook notifications to all matching subscriber endpoints.
 * Called from status-hook, lead creation, post publishing, etc.
 *
 * Supported events:
 *   listing.created, listing.prepared, listing.marketing_complete
 *   lead.created, lead.status_changed
 *   post.published, post.scheduled
 *   open_house.checkin
 */

import { createHmac } from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'

interface OutgoingWebhook {
  id: string
  url: string
  secret: string | null
  events: string[]
}

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
    console.error('[Webhooks] Error fetching webhooks:', fetchError.message)
    return
  }

  if (!webhooks || webhooks.length === 0) return

  const typedWebhooks = webhooks as OutgoingWebhook[]

  // Dispatch to all matching webhooks concurrently
  await Promise.allSettled(
    typedWebhooks.map((webhook) => deliverToWebhook(supabase, webhook, event, payload))
  )
}

/**
 * Delivers a single webhook event to one endpoint and logs the result.
 */
async function deliverToWebhook(
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown delivery error'
    responseBody = message
    console.error(`[Webhooks] Delivery failed for ${webhook.url}: ${message}`)
  }

  // Log delivery attempt -- never throw on logging failure
  try {
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhook.id,
      event,
      payload,
      status_code: statusCode,
      response_body: responseBody,
      success,
    })
  } catch (logErr: unknown) {
    const msg = logErr instanceof Error ? logErr.message : 'Unknown error'
    console.error('[Webhooks] Failed to log delivery:', msg)
  }
}
