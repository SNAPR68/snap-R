import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 50, price: 29, priceDisplay: '$29/mo' },
  { id: 'pro', name: 'Pro', credits: 200, price: 79, priceDisplay: '$79/mo', popular: true },
  { id: 'enterprise', name: 'Enterprise', credits: 500, price: 199, priceDisplay: '$199/mo' },
];
