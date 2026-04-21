import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const StudioClient = dynamic(
  () => import('@/components/studio-client').then(m => ({ default: m.StudioClient })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ id?: string; guided?: string }> }) {
  const params = await searchParams;
  if (!params.id) redirect('/dashboard');
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_tier, credits')
    .eq('id', user.id)
    .single();

  // Determine if user is agent/broker type (shows MLS Export)
  const isAgentType = ['agent', 'broker', 'property-manager'].includes(profile?.role || '');

  return <StudioClient listingId={params.id} userRole={profile?.role} showMlsFeatures={isAgentType} credits={profile?.credits || 0} guided={params.guided === 'true'} subscriptionTier={profile?.subscription_tier || 'free'} />;
}
