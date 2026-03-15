export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { normalizeTier } from '@/lib/content/limits';
import { stripeCheckoutSchema } from '@/lib/validation/schemas';

import { logger } from '@/lib/logger';
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
  });
}

/**
 * Pricing aligned with pricing-section.tsx (Gold/Platinum per-listing model).
 *
 * Gold:
 *   Pay-as-you-go: $28/listing
 *   Monthly  (5–50): $20/listing, (75–300): $16/listing
 *   Annual   (5–50): $16/listing, (75–300): $11/listing
 *
 * Platinum:
 *   Pay-as-you-go: $30/listing
 *   Monthly  (5–50): $22/listing, (75–300): $18/listing
 *   Annual   (5–50): $18/listing, (75–300): $12/listing
 */
function getPricePerListing(planId: string, listings: number, billing: string): number {
  if (billing === 'paygo') {
    return planId === 'platinum' ? 30 : 28;
  }

  if (planId === 'gold' || planId === 'pro') {
    if (billing === 'monthly') return listings >= 75 ? 16 : 20;
    return listings >= 75 ? 11 : 16; // annual
  }

  if (planId === 'platinum' || planId === 'agency') {
    if (billing === 'monthly') return listings >= 75 ? 18 : 22;
    return listings >= 75 ? 12 : 18; // annual
  }

  return 28; // fallback
}

const MAX_LISTINGS = 300;

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const rawBody = await request.json();
    const parsed = stripeCheckoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const rawPlan = parsed.data.plan;
    const normalizedPlan = normalizeTier(rawPlan);
    const listings = parsed.data.listings;
    const billing = parsed.data.billing;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Free plan — no checkout needed
    if (normalizedPlan === 'free') {
      await supabase.from('profiles').update({
        plan: 'free',
        listings_limit: 3,
      }).eq('id', user.id);

      return NextResponse.json({
        success: true,
        redirect: '/dashboard?plan=free',
      });
    }

    // Enterprise self-serve trial checkout
    if (normalizedPlan === 'enterprise' || (rawPlan === 'enterprise')) {
      const billingStr = billing || 'monthly';
      const isAnnual = billingStr === 'annual';
      const enterpriseMonthlyPrice = isAnnual ? 249 : 299;
      const enterpriseCents = enterpriseMonthlyPrice * 100;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'SnapR Enterprise',
                description: `Enterprise plan — API access, custom domains, widgets | ${isAnnual ? 'Annual' : 'Monthly'} billing`,
              },
              unit_amount: enterpriseCents,
              recurring: {
                interval: isAnnual ? 'year' : 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/onboarding?checkout=success&plan=enterprise&billing=${billingStr}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing`,
        customer_email: user.email,
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            userId: user.id,
            plan: 'enterprise',
            planKey: 'enterprise',
            billing: billingStr,
            perMonth: String(enterpriseMonthlyPrice),
          },
        },
        allow_promotion_codes: true,
        metadata: {
          userId: user.id,
          plan: 'enterprise',
          planKey: 'enterprise',
          billing: billingStr,
          totalMonthly: String(enterpriseMonthlyPrice),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Enterprise / agency via sales (non-platinum agency plans)
    if (normalizedPlan === 'agency' && rawPlan !== 'platinum') {
      return NextResponse.json({
        error: 'Enterprise plans require a sales call. Visit /contact to schedule.',
      }, { status: 400 });
    }

    // Validate listing count
    const listingCount = Math.min(Math.max(5, listings || 15), MAX_LISTINGS);
    const billingStr = billing || 'monthly';
    const isAnnual = billingStr === 'annual';

    // Calculate price using same function as pricing page
    const perListing = getPricePerListing(rawPlan, listingCount, billingStr);
    const totalMonthly = perListing * listingCount;
    const totalCents = Math.round(totalMonthly * 100);

    // Display name preserves user-facing plan name
    const displayName = rawPlan === 'platinum' ? 'SnapR Platinum' : 'SnapR Gold';
    const productName = `${displayName} - ${listingCount} listings/mo`;
    const description = `$${perListing}/listing × ${listingCount} listings | ${isAnnual ? 'Annual' : billingStr === 'paygo' ? 'Pay as you go' : 'Monthly'} billing`;

    const session = await stripe.checkout.sessions.create({
      mode: billingStr === 'paygo' ? 'payment' : 'subscription',
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
            ...(billingStr !== 'paygo' && {
              recurring: {
                interval: isAnnual ? 'year' : 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/onboarding?checkout=success&plan=${rawPlan}&listings=${listingCount}&billing=${billingStr}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'}/pricing`,
      customer_email: user.email,
      ...(billingStr !== 'paygo' && {
        subscription_data: {
          trial_period_days: isAnnual ? 14 : 7,
          metadata: {
            userId: user.id,
            plan: normalizedPlan,
            planKey: rawPlan,
            billing: billingStr,
            listings: String(listingCount),
            perListing: String(perListing),
          },
        },
      }),
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
        plan: normalizedPlan,
        planKey: rawPlan,
        billing: billingStr,
        listings: String(listingCount),
        perListing: String(perListing),
        totalMonthly: String(totalMonthly),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Checkout error:', error);
    return NextResponse.json(
      { error: message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
