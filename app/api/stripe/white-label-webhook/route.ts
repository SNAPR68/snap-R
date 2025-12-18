export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This webhook handles white-label subscription events
// Add this endpoint to your Stripe webhook configuration:
// https://snap-r.com/api/stripe/white-label-webhook

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a white-label checkout
        if (session.metadata?.type === 'white_label') {
          const organizationId = session.metadata.organization_id;
          const subscriptionId = session.subscription as string;

          // Activate white-label
          await supabase
            .from('organizations')
            .update({
              white_label_active: true,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
            })
            .eq('id', organizationId);

          console.log(`White-label activated for org: ${organizationId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.type === 'white_label') {
          const organizationId = subscription.metadata.organization_id;
          const status = subscription.status;

          await supabase
            .from('organizations')
            .update({
              white_label_active: status === 'active',
              subscription_status: status,
            })
            .eq('id', organizationId);

          console.log(`White-label status updated for org ${organizationId}: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.type === 'white_label') {
          const organizationId = subscription.metadata.organization_id;

          // Deactivate white-label
          await supabase
            .from('organizations')
            .update({
              white_label_active: false,
              subscription_status: 'canceled',
            })
            .eq('id', organizationId);

          console.log(`White-label canceled for org: ${organizationId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          if (subscription.metadata?.type === 'white_label') {
            const organizationId = subscription.metadata.organization_id;

            await supabase
              .from('organizations')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', organizationId);

            console.log(`White-label payment failed for org: ${organizationId}`);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
