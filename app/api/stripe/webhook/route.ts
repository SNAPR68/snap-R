export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_CREDITS: Record<string, number> = {
  starter: 50,
  professional: 150,
  agency: 500,
};

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan, type, photoId, isUrgent, instructions } = session.metadata || {};

        if (type === 'human_edit') {
          await supabase.from('human_edit_orders').insert({
            user_id: userId,
            photo_id: photoId,
            is_urgent: isUrgent === 'true',
            instructions,
            amount_paid: session.amount_total,
            status: 'pending',
          });
        } else if (plan && userId) {
          const credits = PLAN_CREDITS[plan] || 0;
          await supabase.from('profiles').update({
            plan,
            credits,
            stripe_customer_id: session.customer as string,
          }).eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile?.plan) {
          const credits = PLAN_CREDITS[profile.plan] || 0;
          await supabase.from('profiles').update({ credits }).eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase.from('profiles').update({
          plan: 'free',
          credits: 0,
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
