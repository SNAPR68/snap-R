import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudioClient } from '@/components/studio-client';

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  if (!params.id) redirect('/dashboard');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return <StudioClient listingId={params.id} />;
}
