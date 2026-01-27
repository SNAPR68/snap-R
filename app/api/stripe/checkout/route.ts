export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

// New pricing model: Pro = $99 base + $18/listing (max 30)
const PRO_BASE_PRICE = 99; // dollars
const PRO_PER_LISTING = 18; // dollars
const MAX_LISTINGS = 30;
const ANNUAL_DISCOUNT = 0.20; // 20% off base only

function calculateProPrice(listings: number, isAnnual: boolean): { base: number; perListing: number; total: number; totalCents: number } {
  const cappedListings = Math.min(listings, MAX_LISTINGS);
  const base = isAnnual ? PRO_BASE_PRICE * (1 - ANNUAL_DISCOUNT) : PRO_BASE_PRICE;
  const listingCost = PRO_PER_LISTING * cappedListings;
  const total = base + listingCost;
  return {
    base,
    perListing: PRO_PER_LISTING,
    total,
    totalCents: Math.round(total * 100),
  };
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { plan, listings, billing } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Free plan - no checkout needed
    if (plan === 'free') {
      await supabase.from('profiles').update({
        plan: 'free',
        listings_limit: 3,
      }).eq('id', user.id);
      
      return NextResponse.json({ 
        success: true, 
        redirect: '/dashboard?plan=free' 
      });
    }

    // Only Pro plan is self-serve (Team/Brokerage require sales call)
    if (plan !== 'pro') {
      return NextResponse.json({ 
        error: 'Team and Brokerage plans require a sales call. Visit /contact to schedule.' 
      }, { status: 400 });
    }

    // Validate listings (1-30 for Pro)
    const listingCount = Math.min(Math.max(1, listings || 15), MAX_LISTINGS);
    const isAnnual = billing === 'annual';
    const { base, total, totalCents } = calculateProPrice(listingCount, isAnnual);

    const productName = `SnapR Pro - ${listingCount} listings/mo`;
    const description = `$${base.toFixed(0)} base + $${PRO_PER_LISTING}/listing | ${isAnnual ? 'Annual' : 'Monthly'} billing`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description,
            },
            unit_amount: totalCents,
            recurring: {
              interval: isAnnual ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing`,
      customer_email: user.email,
      subscription_data: {
        trial_period_days: isAnnual ? 14 : 7,
        metadata: {
          userId: user.id,
          plan: 'pro',
          billing,
          listings: String(listingCount),
          basePrice: String(base),
          perListing: String(PRO_PER_LISTING),
        },
      },
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        plan: 'pro',
        billing,
        listings: String(listingCount),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
