export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
  });
}

// New pricing model
// Photographers: ultimate ($12), complete ($14)
// Agents: starter ($14), complete ($18)
const PLAN_PRICING: Record<string, { base: number; annual: number; description: string }> = {
  // Photographer plans
  'photographer-ultimate': { base: 12, annual: 9.60, description: '75 photos, unlimited twilight, 2 staging/listing' },
  'photographer-complete': { base: 14, annual: 11.20, description: '75 photos, tours, voiceovers, video, CMA' },
  // Agent plans
  'agent-starter': { base: 14, annual: 11.20, description: '60 photos, content studio, email marketing' },
  'agent-complete': { base: 18, annual: 14.40, description: '75 photos, full marketing suite, tours, video' },
};

// Volume discounts (per listing reduction)
const VOLUME_DISCOUNTS: Record<number, number> = {
  10: 0,
  15: 0.50,
  20: 1.00,
  25: 1.50,
  30: 2.00,
  40: 2.50,
  50: 3.00,
};

function calculatePrice(
  role: 'photographer' | 'agent',
  plan: string,
  listings: number,
  isAnnual: boolean
): { pricePerListing: number; total: number; totalCents: number } {
  const planKey = `${role}-${plan}`;
  const pricing = PLAN_PRICING[planKey];
  
  if (!pricing) {
    throw new Error(`Invalid plan: ${planKey}`);
  }

  // Base price per listing
  let pricePerListing = isAnnual ? pricing.annual : pricing.base;
  
  // Apply volume discount
  const discount = VOLUME_DISCOUNTS[listings] || 0;
  pricePerListing = Math.max(pricePerListing - discount, pricing.base * 0.5); // Never below 50% of base
  
  const total = pricePerListing * listings;
  const totalCents = Math.round(total * 100);

  return { pricePerListing, total, totalCents };
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { role, plan, listings, billing } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Free plan doesn't need checkout
    if (plan === 'free') {
      // Just update the profile to free plan
      await supabase.from('profiles').update({
        plan: 'free',
        role: role || 'photographer',
        listings_limit: 3,
      }).eq('id', user.id);
      
      return NextResponse.json({ 
        success: true, 
        redirect: '/dashboard?plan=free' 
      });
    }

    // Validate inputs
    if (!['photographer', 'agent'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const validPlans = role === 'photographer' 
      ? ['ultimate', 'complete'] 
      : ['starter', 'complete'];
    
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan for role' }, { status: 400 });
    }

    const validListings = [10, 15, 20, 25, 30, 40, 50];
    if (!validListings.includes(listings)) {
      return NextResponse.json({ error: 'Invalid listing count' }, { status: 400 });
    }

    const isAnnual = billing === 'annual';
    const { pricePerListing, total, totalCents } = calculatePrice(role, plan, listings, isAnnual);

    const planKey = `${role}-${plan}`;
    const pricing = PLAN_PRICING[planKey];
    
    const productName = `SnapR ${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${listings} listings/mo`;
    const description = `${pricing.description} • ${isAnnual ? 'Annual' : 'Monthly'} billing • $${pricePerListing.toFixed(2)}/listing`;

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
          role,
          plan,
          planKey,
          billing,
          listings: String(listings),
          pricePerListing: String(pricePerListing),
        },
      },
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        role,
        plan,
        planKey,
        billing,
        listings: String(listings),
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
