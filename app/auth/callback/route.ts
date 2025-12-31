import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, subscription_tier')
        .eq('id', data.user.id)
        .single();

      // If no profile, create one with defaults
      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          subscription_tier: 'free',
          listings_limit: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        // New user - go to onboarding
        return NextResponse.redirect(origin + '/onboarding');
      }

      // Existing user - check if onboarding complete
      if (!profile.role) {
        return NextResponse.redirect(origin + '/onboarding');
      }

      // Fully onboarded - go to dashboard
      return NextResponse.redirect(origin + (next || '/dashboard'));
    }
  }

  return NextResponse.redirect(origin + '/auth/login?error=auth_failed');
}
