export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

// Current add-on prices (in cents)
const ADDON_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  virtual_renovation_basic: { amount: 1500, name: 'Virtual Renovation - Basic', description: 'Single room renovation' },
  virtual_renovation_standard: { amount: 2500, name: 'Virtual Renovation - Standard', description: 'Up to 3 rooms' },
  virtual_renovation_premium: { amount: 5000, name: 'Virtual Renovation - Premium', description: 'Whole home renovation' },
  human_editing: { amount: 500, name: 'Human Editing', description: 'Professional editor touch-up per image' },
  extra_user: { amount: 2500, name: 'Extra User', description: 'Additional team member (monthly)' },
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { addonType, listingId, quantity = 1 } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addon = ADDON_PRICES[addonType];
    if (!addon) {
      return NextResponse.json({ error: 'Invalid add-on type' }, { status: 400 });
    }

    // Extra user is a subscription, others are one-time
    const isSubscription = addonType === 'extra_user';

    if (isSubscription) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: addon.name, description: addon.description },
            unit_amount: addon.amount,
            recurring: { interval: 'month' },
          },
          quantity,
        }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?addon=success&type=${addonType}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/settings`,
        customer_email: user.email,
        metadata: { userId: user.id, addonType, quantity: quantity.toString() },
      });
      return NextResponse.json({ url: session.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: addon.name, description: addon.description },
          unit_amount: addon.amount,
        },
        quantity,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?addon=success&type=${addonType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing`,
      customer_email: user.email,
      metadata: { userId: user.id, addonType, listingId: listingId || '', quantity: quantity.toString() },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Addon checkout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 });
  }
}
