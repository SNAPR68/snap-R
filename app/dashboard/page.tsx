import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard-client';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: listings } = await supabase.from('listings').select('*, photos(count)').eq('user_id', user.id).order('created_at', { ascending: false });

  const formattedListings = (listings || []).map((listing) => ({
    ...listing,
    photo_count: (listing as any).photo_count ?? listing?.photos?.[0]?.count ?? 0,
  }));

  return <DashboardClient user={user} listings={formattedListings} />;
}
