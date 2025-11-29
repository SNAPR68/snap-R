import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard-client';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: listings } = await supabase.from('listings').select('*, photos(count)').eq('user_id', user.id).order('created_at', { ascending: false });

  return <DashboardClient user={user} listings={listings || []} profile={profile} />;
}
