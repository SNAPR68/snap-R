export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// White-label pricing
const WHITE_LABEL_PRICE = 9900; // $99.00 in cents
const WHITE_LABEL_PRODUCT_NAME = 'SnapR White-Label';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user owns this organization
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (org.white_label_active) {
      return NextResponse.json({ error: 'White-label is already active' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create or get white-label product
    let product;
    const products = await stripe.products.search({
      query: `name:'${WHITE_LABEL_PRODUCT_NAME}'`,
    });

    if (products.data.length > 0) {
      product = products.data[0];
    } else {
      product = await stripe.products.create({
        name: WHITE_LABEL_PRODUCT_NAME,
        description: 'Custom branding, subdomain, and white-label features for SnapR',
      });
    }

    // Create or get price
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: 'recurring',
    });

    let price;
    if (prices.data.length > 0) {
      price = prices.data[0];
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: WHITE_LABEL_PRICE,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organization?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/organization?canceled=true`,
      metadata: {
        organization_id: organizationId,
        user_id: user.id,
        type: 'white_label',
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
          type: 'white_label',
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('White-label checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle successful subscription (called by webhook)
export async function PUT(request: NextRequest) {
  try {
    const { organizationId, subscriptionId, status } = await request.json();

    // This would typically be called by the Stripe webhook
    // For now, we'll create a separate webhook handler

    const supabase = await createClient();
    
    const { error } = await supabase
      .from('organizations')
      .update({
        white_label_active: status === 'active',
        stripe_subscription_id: subscriptionId,
        subscription_status: status,
      })
      .eq('id', organizationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('White-label update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
