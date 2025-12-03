import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-11-17.clover' });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, photoUrl, instructions, isUrgent } = await request.json();

    const amount = isUrgent ? 1500 : 500; // $15 or $5 in cents

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: isUrgent ? 'Urgent Human Edit (4h)' : 'Human Edit Service (24h)',
              description: 'Professional manual photo editing by our expert team',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/studio?id=${listingId}&human_edit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/studio?id=${listingId}&human_edit=cancelled`,
      metadata: {
        type: 'human_edit',
        userId: user.id,
        userEmail: user.email || '',
        listingId,
        photoUrl,
        instructions,
        isUrgent: isUrgent ? 'true' : 'false',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Human edit checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
