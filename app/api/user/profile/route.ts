import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/user/profile
// Returns lightweight profile fields needed by client-side analytics providers.
// Intentionally minimal — never expose sensitive billing fields client-side.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, subscription_tier, stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    plan: profile.plan ?? profile.subscription_tier ?? 'free',
    subscription_tier: profile.subscription_tier ?? 'free',
    stripe_customer_id: profile.stripe_customer_id ?? null,
  });
}
