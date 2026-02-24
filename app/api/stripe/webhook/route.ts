export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminSupabase } from '@/lib/supabase/admin';
import { normalizeTier, getListingLimits } from '@/lib/content/limits';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = adminSupabase();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('processed_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await supabase
      .from('processed_webhook_events')
      .insert({ event_id: event.id, event_type: event.type });
  } catch {
    // Ignore constraint violation from race condition
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const { userId, role, plan, planKey, listings, type, photoId, isUrgent, instructions } = metadata;

        if (type === 'human_edit') {
          await supabase.from('human_edit_orders').insert({
            user_id: userId,
            photo_id: photoId,
            is_urgent: isUrgent === 'true',
            instructions,
            amount_paid: session.amount_total,
            status: 'pending',
          });
          break;
        }

        if (metadata.addonType) {
          await supabase.from('addon_purchases').insert({
            user_id: userId,
            addon_type: metadata.addonType,
            listing_id: metadata.listingId || null,
            quantity: parseInt(metadata.quantity || '1'),
            amount_paid: session.amount_total,
            status: 'completed',
          });
          break;
        }

        // Handle subscription — use centralized limits from lib/content/limits.ts
        if (plan && userId) {
          const normalizedPlan = normalizeTier(planKey || plan);
          const limits = getListingLimits(normalizedPlan);
          const listingsLimit = limits.listings > 0 ? limits.listings : parseInt(listings || '10');

          const { error: updateError } = await supabase.from('profiles').update({
            plan: normalizedPlan,
            subscription_tier: normalizedPlan,
            role: role || 'photographer',
            listings_limit: listingsLimit,
            photos_per_listing: limits.photos,
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            billing_cycle: metadata.billing || 'monthly',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

          if (updateError) {
            console.error(`[Webhook] Profile update failed for ${userId}:`, updateError.message);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const { error: updateError } = await supabase.from('profiles').update({
            listings_used_this_month: 0,
            subscription_status: 'active',
            last_payment_date: new Date().toISOString(),
          }).eq('id', profile.id);

          if (updateError) {
            console.error(`[Webhook] Usage reset failed for ${profile.id}:`, updateError.message);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const { error: updateError } = await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', invoice.customer as string);

        if (updateError) {
          console.error(`[Webhook] past_due update failed:`, updateError.message);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'canceled' ? 'canceled'
          : 'inactive';

        const updateData: Record<string, unknown> = {
          subscription_status: status,
          updated_at: new Date().toISOString(),
        };

        const subMeta = subscription.metadata || {};
        if (subMeta.plan || subMeta.planKey) {
          const normalizedPlan = normalizeTier(subMeta.planKey || subMeta.plan);
          updateData.plan = normalizedPlan;
          updateData.subscription_tier = normalizedPlan;
          const limits = getListingLimits(normalizedPlan);
          updateData.listings_limit = limits.listings;
          updateData.photos_per_listing = limits.photos;
        }

        const { error: updateError } = await supabase.from('profiles').update(updateData)
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error(`[Webhook] Subscription update failed for ${customerId}:`, updateError.message);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { error: updateError } = await supabase.from('profiles').update({
          plan: 'free',
          subscription_tier: 'free',
          role: 'photographer',
          listings_limit: 3,
          photos_per_listing: 30,
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', subscription.customer as string);

        if (updateError) {
          console.error(`[Webhook] Downgrade failed:`, updateError.message);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
