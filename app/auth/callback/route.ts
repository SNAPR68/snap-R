import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Every response from this route must carry no-store headers so that
// Vercel's edge cache cannot pin a stale 500 (or any other response)
// and keep replaying it on If-None-Match revalidation. See EXECUTION
// CHANGELOG 2026-04-15 for the original incident.
function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.headers.set('CDN-Cache-Control', 'no-store');
  res.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  return res;
}

export async function GET(request: Request) {
  // Default origin for worst-case redirects
  let origin = 'https://snap-r.com';

  try {
    const url = new URL(request.url);
    origin = url.origin;
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const next = searchParams.get('next');
    const ref = searchParams.get('ref');

    if (!code) {
      return noStore(NextResponse.redirect(origin + '/auth/login?error=missing_code'));
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data?.user) {
      logger.warn('[auth/callback] exchangeCodeForSession failed:', error?.message || 'no user');
      return noStore(NextResponse.redirect(origin + '/auth/login?error=auth_failed'));
    }

    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, subscription_tier, onboarded_at')
      .eq('id', data.user.id)
      .single();

    // If no profile at all - this is a brand new user
    if (!profile) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
        avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        subscription_tier: 'free',
        listings_limit: 3,
        referred_by: ref || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // RevenueCat integration is dormant — Stripe is primary billing
      // (see CLAUDE.md item 50). Skip subscriber creation to avoid
      // module-load crashes when REVENUECAT_API_KEY is not set.

      // Send welcome email (fire-and-forget — failure doesn't block signup)
      if (data.user.email) {
        fetch(`${origin}/api/auth/welcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          }),
          signal: AbortSignal.timeout(10000),
        }).catch(() => { /* non-blocking */ });
      }

      // New user - go to onboarding
      return noStore(NextResponse.redirect(origin + '/onboarding'));
    }

    // Profile exists — check if onboarding was completed
    if (!profile.onboarded_at) {
      // Incomplete onboarding — send back to finish it (preserve plan params if present)
      const plan = searchParams.get('plan');
      const listings = searchParams.get('listings');
      const billing = searchParams.get('billing');
      const onboardParams = [
        plan && `plan=${plan}`,
        listings && `listings=${listings}`,
        billing && `billing=${billing}`,
      ].filter(Boolean).join('&');
      const onboardUrl = onboardParams ? `/onboarding?${onboardParams}` : '/onboarding';
      return noStore(NextResponse.redirect(origin + onboardUrl));
    }

    // Fully onboarded user — go to dashboard
    return noStore(NextResponse.redirect(origin + (next || '/dashboard')));
  } catch (error: unknown) {
    // Never return a 500 from auth callback — always redirect to login
    // with an error param so users are never stranded.
    const message = error instanceof Error ? error.message : 'unknown';
    logger.error('[auth/callback] unhandled error:', message);
    return noStore(NextResponse.redirect(origin + '/auth/login?error=callback_failed'));
  }
}
