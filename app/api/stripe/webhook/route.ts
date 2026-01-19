export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Listings limits per plan
const PLAN_LIMITS: Record<string, { listings: number; photos: number }> = {
  // Free
  'free': { listings: 3, photos: 30 },
  // Photographer plans
  'photographer-ultimate': { listings: 0, photos: 75 }, // 0 = use purchased listings
  'photographer-complete': { listings: 0, photos: 75 },
  // Agent plans
  'agent-starter': { listings: 0, photos: 60 },
  'agent-complete': { listings: 0, photos: 75 },
  // Legacy plans (for existing users)
  'starter': { listings: 10, photos: 50 },
  'professional': { listings: 30, photos: 75 },
  'agency': { listings: 50, photos: 75 },
  'pro': { listings: 30, photos: 75 },
  'team': { listings: 50, photos: 75 },
};

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabase();
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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const { userId, role, plan, planKey, listings, type, photoId, isUrgent, instructions } = metadata;

        // Handle human edit orders
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

        // Handle add-on purchases
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

        // Handle subscription
        if (plan && userId) {
          const effectivePlanKey = planKey || plan;
          const limits = PLAN_LIMITS[effectivePlanKey] || PLAN_LIMITS['free'];
          const listingsLimit = limits.listings > 0 ? limits.listings : parseInt(listings || '10');
          
          await supabase.from('profiles').update({
            plan: effectivePlanKey,
            role: role || 'photographer',
            listings_limit: listingsLimit,
            photos_per_listing: limits.photos,
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            billing_cycle: metadata.billing || 'monthly',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Reset monthly usage on successful payment
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('profiles').update({
            listings_used_this_month: 0,
            subscription_status: 'active',
            last_payment_date: new Date().toISOString(),
          }).eq('id', profile.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        const status = subscription.status === 'active' ? 'active' 
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'canceled' ? 'canceled'
          : 'inactive';

        await supabase.from('profiles').update({
          subscription_status: status,
        }).eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Downgrade to free plan
        await supabase.from('profiles').update({
          plan: 'free',
          role: 'photographer',
          listings_limit: 3,
          photos_per_listing: 30,
          subscription_status: 'canceled',
        }).eq('stripe_customer_id', subscription.customer as string);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
