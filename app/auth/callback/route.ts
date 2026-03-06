import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const ref = searchParams.get('ref');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
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
          }).catch(() => { /* non-blocking */ });
        }

        // New user - go to onboarding
        return NextResponse.redirect(origin + '/onboarding');
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
        return NextResponse.redirect(origin + onboardUrl);
      }

      // Fully onboarded user — go to dashboard
      return NextResponse.redirect(origin + (next || '/dashboard'));
    }
  }

  return NextResponse.redirect(origin + '/auth/login?error=auth_failed');
}
