import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudioClient } from '@/components/studio-client';

export const dynamic = 'force-dynamic';

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const listingId = params.id;
  if (!listingId) redirect('/dashboard');

  const { data: listing } = await supabase
    .from('listings')
    .select('*, photos(*)')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single();

  if (!listing) redirect('/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <StudioClient listing={listing} photos={listing.photos || []} profile={profile} />;
}
