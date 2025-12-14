import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FolderOpen, Image, Coins, BarChart3, CreditCard, Settings, Camera, Sparkles, Palette, LogOut, Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/auth/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      subscription_tier: 'free',
      credits: 25,
    });
    redirect('/onboarding');
  }

  if (!profile.role) redirect('/onboarding');

  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos(id, raw_url, processed_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const totalPhotos = listings?.reduce((acc: number, l: any) => acc + (l.photos?.length || 0), 0) || 0;


  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/raw-images/${path}`;
  };
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
            <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D4A017]/10 text-[#D4A017]">
            <FolderOpen className="w-5 h-5" />
            <span>Listings</span>
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all">
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </Link>
          <Link href="/dashboard/billing" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all">
            <CreditCard className="w-5 h-5" />
            <span>Billing</span>
          </Link>
          
          {/* Content Studio - Premium Styled */}
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs text-white/30 uppercase tracking-wider mb-2">Content</p>
          </div>
          <Link href="/dashboard/content-studio" className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4A017]/20 via-[#D4A017]/10 to-[#B8860B]/20 border border-[#D4A017]/40 hover:border-[#D4A017]/70 hover:from-[#D4A017]/30 hover:to-[#B8860B]/30 transition-all group overflow-hidden">
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4A017]/50 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center shadow-lg shadow-[#D4A017]/20">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-semibold text-[#D4A017] group-hover:text-[#F4CF47] transition-colors">Content Studio</span>
                <p className="text-[10px] text-white/40">Create social posts</p>
              </div>
            </div>
          </Link>
          {/* Listing Intelligence AI */}
          <Link href="/dashboard/listing-intelligence" className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-indigo-500/20 border border-purple-500/40 hover:border-purple-500/70 hover:from-purple-500/30 hover:to-indigo-500/30 transition-all group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">Listing Intelligence</span>
                <p className="text-[10px] text-white/40">AI photo analysis</p>
              </div>
            </div>
            <span className="absolute top-1 right-2 px-1.5 py-0.5 bg-purple-500/30 text-purple-300 text-[8px] font-bold rounded">NEW</span>
          </Link>

          <Link href="/dashboard/brand" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all">
            <Palette className="w-5 h-5" />
            <span>Brand Profile</span>
          </Link>

          <div className="pt-4 pb-2">
            <p className="px-4 text-xs text-white/30 uppercase tracking-wider mb-2">Account</p>
          </div>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-[#D4A017] flex items-center justify-center text-black font-semibold">
              {profile.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{profile.full_name || 'User'}</p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>
              <p className="text-xs text-[#D4A017] capitalize">{profile.subscription_tier || 'Free'} Plan</p>
          </div>
        </div>
          <form action="/auth/signout" method="post" className="mt-3">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl text-white/60 hover:text-red-400 transition-all text-sm">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-sm text-white/50">
              <span className="capitalize">{profile.subscription_tier || 'Free'} Plan</span>
              <span className="text-white/30"> · {profile.role?.replace('-', ' ')}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/camera" className="flex items-center gap-2 px-4 py-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl hover:bg-[#D4A017]/20 transition-all">
              <Camera className="w-4 h-4 text-[#D4A017]" />
              <span className="text-[#D4A017] font-medium">Snap & Enhance</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Coins className="w-4 h-4 text-[#D4A017]" />
              <span className="font-semibold">{profile.credits || 0}</span>
              <span className="text-white/50 text-sm">credits</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-[#D4A017]" />
                </div>
                <span className="text-white/50">Total Listings</span>
              </div>
              <p className="text-3xl font-bold">{listings?.length || 0}</p>
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/10 flex items-center justify-center">
                  <Image className="w-5 h-5 text-[#D4A017]" />
                </div>
                <span className="text-white/50">Total Photos</span>
              </div>
              <p className="text-3xl font-bold">{totalPhotos}</p>
            </div>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A017]/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-[#D4A017]" />
                </div>
                <span className="text-white/50">Credits Left</span>
              </div>
              <p className="text-3xl font-bold">{profile.credits || 0}</p>
            </div>
          </div>

          {/* Create Listing Button */}
          <Link
            href="/listings/new"
            className="block mb-6 p-6 bg-gradient-to-r from-[#D4A017]/10 to-[#B8860B]/10 border border-[#D4A017]/30 rounded-xl hover:border-[#D4A017]/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#D4A017] flex items-center justify-center">
                  <Plus className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Create New Listing</h3>
                  <p className="text-white/50">Upload photos and enhance them with AI</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#D4A017]/20 flex items-center justify-center group-hover:bg-[#D4A017]/30 transition-all">
                <Plus className="w-5 h-5 text-[#D4A017]" />
              </div>
            </div>
          </Link>

          {/* Recent Listings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Listings</h2>
            {listings && listings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing: any) => (
                  <Link
                    key={listing.id}
                    href={`/dashboard/studio?id=${listing.id}`}
                    className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden hover:border-[#D4A017]/50 transition-all group"
                  >
                    <div className="aspect-video bg-white/5 relative overflow-hidden">
                      {(() => {
                        const photo = listing.photos?.[0];
                        const url = photo?.processed_url || photo?.raw_url;
                        const imageUrl = getImageUrl(url);
                        return imageUrl ? (
                          <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FolderOpen className="w-10 h-10 text-white/20" />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg truncate group-hover:text-[#D4A017] transition-colors">
                        {listing.title || listing.address || 'Untitled Listing'}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
                        <span>{listing.photos?.length || 0} photos</span>
                        <span>·</span>
                        <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#1A1A1A] border border-white/10 rounded-xl">
                <FolderOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg mb-6">No listings yet</p>
                <Link
                  href="/listings/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-5 h-5" /> Create Your First Listing
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
