export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { stripeHumanEditCheckoutSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json(); const validated = parseBody(stripeHumanEditCheckoutSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { photoId, isUrgent, instructions } = body;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const amount = isUrgent ? 1500 : 500; // $15 or $5

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: isUrgent ? 'Human Edit (4hr Rush)' : 'Human Edit (24hr)',
            description: instructions || 'Professional photo editing',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?human_edit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard`,
      customer_email: user.email,
      metadata: { userId: user.id, photoId, isUrgent: String(isUrgent), instructions, type: 'human_edit' },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    logger.error('Human edit checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
