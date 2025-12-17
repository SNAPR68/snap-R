export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

// Dynamic pricing calculation
function calculatePrice(
  plan: 'pro' | 'team',
  listings: number,
  isAnnual: boolean,
  teamSize?: number
): number {
  // Per-listing pricing (decreases with volume)
  const perListingPrice: Record<number, { monthly: number; annual: number }> = {
    10: { monthly: 25, annual: 20 },
    20: { monthly: 22, annual: 18 },
    30: { monthly: 19, annual: 15 },
    50: { monthly: 17, annual: 13 },
    75: { monthly: 15, annual: 12 },
    100: { monthly: 14, annual: 11 },
    125: { monthly: 13, annual: 10 },
    150: { monthly: 12, annual: 9 },
  };

  // Team base fees
  const teamBaseFees: Record<number, { monthly: number; annual: number }> = {
    5: { monthly: 199, annual: 149 },
    10: { monthly: 399, annual: 299 },
    25: { monthly: 649, annual: 499 },
  };

  const tier = perListingPrice[listings];
  if (!tier) throw new Error('Invalid listing tier');

  const pricePerListing = isAnnual ? tier.annual : tier.monthly;
  let totalMonthly = listings * pricePerListing;

  // Add team base fee if team plan
  if (plan === 'team' && teamSize) {
    const teamFee = teamBaseFees[teamSize];
    if (!teamFee) throw new Error('Invalid team size');
    totalMonthly += isAnnual ? teamFee.annual : teamFee.monthly;
  }

  // Return in cents for Stripe
  return totalMonthly * 100;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support both old format (plan: 'starter') and new format (plan: 'pro', listings: 75, etc.)
    const { plan, billing, listings, teamSize } = body;

    // Handle legacy plans (starter, professional, agency)
    const LEGACY_PRICE_IDS: Record<string, string> = {
      starter: process.env.STRIPE_STARTER_PRICE_ID || '',
      professional: process.env.STRIPE_PRO_PRICE_ID || '',
      agency: process.env.STRIPE_AGENCY_PRICE_ID || '',
    };

    if (LEGACY_PRICE_IDS[plan]) {
      // Old checkout flow
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: LEGACY_PRICE_IDS[plan], quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing`,
        customer_email: user.email,
        metadata: { userId: user.id, plan },
      });
      return NextResponse.json({ url: session.url });
    }

    // New dynamic pricing flow
    if (plan === 'free') {
      return NextResponse.json({ error: 'Free plan does not require checkout' }, { status: 400 });
    }

    if (!['pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const isAnnual = billing === 'annual';
    const priceInCents = calculatePrice(plan, listings, isAnnual, teamSize);

    // Build product name
    let productName = plan === 'team' 
      ? `SnapR Team - ${teamSize} users, ${listings} listings`
      : `SnapR Pro - ${listings} listings`;

    // Create checkout session with dynamic price
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: `${isAnnual ? 'Annual' : 'Monthly'} subscription - ${listings} listings/month, 75 photos per listing`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: isAnnual ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing?checkout=cancelled`,
      customer_email: user.email,
      subscription_data: {
        trial_period_days: isAnnual ? 30 : 7, // 1 month free for annual, 1 week for monthly
        metadata: {
          userId: user.id,
          plan,
          billing,
          listings: listings.toString(),
          teamSize: teamSize?.toString() || '',
        },
      },
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        plan,
        billing,
        listings: listings.toString(),
        teamSize: teamSize?.toString() || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 });
  }
}
