import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FolderOpen, Clock, Image, Coins, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Get profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // Check if user has completed onboarding
  if (!profile?.role) {
    redirect('/onboarding');
  }

  // Check if user has selected a plan (gate access)
  if (!profile?.subscription_tier || profile?.subscription_tier === 'free') {
    redirect(`/pricing?role=${encodeURIComponent(profile.role)}`);
  }

  // Get user's listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const totalPhotos = listings?.reduce((acc, l) => acc + (l.photos?.[0]?.count || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
          <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10">
            <Coins className="w-4 h-4 text-[#D4A017]" />
            <span className="font-semibold">{profile?.credits || 0}</span>
            <span className="text-white/50 text-sm">credits</span>
          </Link>
          <Link href="/dashboard/settings" className="w-9 h-9 rounded-full bg-[#D4A017] flex items-center justify-center text-black font-semibold">
            {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-white/50">
            {profile?.plan && <span className="capitalize">{profile.plan} Plan</span>}
            {profile?.role && <span className="text-white/30"> · {profile.role}</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-[#D4A017]" />
              <span className="text-white/50">Listings</span>
            </div>
            <p className="text-2xl font-bold">{listings?.length || 0}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Image className="w-5 h-5 text-[#D4A017]" />
              <span className="text-white/50">Photos</span>
            </div>
            <p className="text-2xl font-bold">{totalPhotos}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-5 h-5 text-[#D4A017]" />
              <span className="text-white/50">Credits</span>
            </div>
            <p className="text-2xl font-bold">{profile?.credits || 0}</p>
          </div>
        </div>

        {/* New Listing CTA */}
        <Link
          href="/upload"
          className="block mb-8 p-6 bg-gradient-to-r from-[#D4A017]/10 to-[#B8860B]/10 border border-[#D4A017]/30 rounded-xl hover:border-[#D4A017]/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4A017] flex items-center justify-center">
                <Plus className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Create New Listing</h3>
                <p className="text-white/50">Upload photos and enhance them with AI</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#D4A017] group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Recent Listings */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Listings</h2>
          {listings && listings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/dashboard/studio?id=${listing.id}`}
                  className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
                >
                  <div className="aspect-video bg-white/5 flex items-center justify-center">
                    <FolderOpen className="w-8 h-8 text-white/20" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate group-hover:text-[#D4A017] transition-colors">
                      {listing.title || listing.address || 'Untitled Listing'}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
                      <span>{listing.photos?.[0]?.count || 0} photos</span>
                      <span>·</span>
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#1A1A1A] border border-white/10 rounded-xl">
              <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">No listings yet</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" /> Create Your First Listing
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
