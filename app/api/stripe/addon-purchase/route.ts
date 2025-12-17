export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

// Add-on prices (in cents)
const ADDON_PRICES: Record<string, { amount: number; name: string }> = {
  floorplan_2d: { amount: 2500, name: 'Floor Plan - 2D' },
  floorplan_3d: { amount: 5000, name: 'Floor Plan - 3D' },
  virtual_tour: { amount: 5000, name: 'Virtual Tour' },
  virtual_renovation: { amount: 3500, name: 'Virtual Renovation' },
  ai_voiceover: { amount: 1500, name: 'AI Voiceover' },
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

    // Validate addon
    const addon = ADDON_PRICES[addonType];
    if (!addon) {
      return NextResponse.json({ error: 'Invalid add-on type' }, { status: 400 });
    }

    // Create one-time payment session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: addon.name,
              description: `One-time purchase for your listing`,
            },
            unit_amount: addon.amount,
          },
          quantity,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?addon=success&type=${addonType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        addonType,
        listingId: listingId || '',
        quantity: quantity.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Addon checkout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 });
  }
}
