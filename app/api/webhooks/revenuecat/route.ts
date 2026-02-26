import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

// RevenueCat webhook — analytics-only integration.
// Stripe remains the source of truth for billing; we log RC events for
// visibility but do NOT update subscription_tier here (Stripe webhook owns that).
//
// Docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  product_id?: string;
  currency?: string;
  price?: number;
  expiration_at_ms?: number;
  subscriber_attributes?: Record<string, { value: string }>;
}

interface RevenueCatPayload {
  event: RevenueCatEvent;
}

// RevenueCat signs webhooks with a shared secret sent in the
// Authorization header as a Bearer token.
function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return true; // allow if not configured (dev mode)

  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === secret;
}

export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: RevenueCatPayload;
  try {
    payload = (await request.json()) as RevenueCatPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.event;
  if (!event?.type || !event?.app_user_id) {
    return NextResponse.json({ error: 'Missing event fields' }, { status: 400 });
  }

  const { type, app_user_id } = event;

  const db = adminSupabase();

  // Log to notification_logs for admin visibility (reuse existing table)
  await db.from('notification_logs').insert({
    user_id: app_user_id,
    notification_type: `revenuecat_${type.toLowerCase()}`,
    channel: 'revenuecat',
    success: true,
    metadata: {
      product_id: event.product_id,
      currency: event.currency,
      price: event.price,
      expiration_at_ms: event.expiration_at_ms,
    },
  });

  // For BILLING_ISSUE / EXPIRATION: flag profile for review.
  // Stripe webhook is the authoritative handler — this is supplemental logging.
  if (type === 'BILLING_ISSUE' || type === 'EXPIRATION') {
    await db
      .from('profiles')
      .update({ last_payment_date: null })
      .eq('id', app_user_id)
      .is('last_payment_date', null); // only update if already null — avoid overwriting Stripe data
  }

  return NextResponse.json({ received: true });
}
