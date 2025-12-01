'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, LogOut, FolderOpen, Settings, MoreVertical, Trash2, Image as ImageIcon, BarChart3 } from 'lucide-react';
import { DashboardAnalytics } from './dashboard-analytics';

interface Listing {
  id: string;
  title: string;
  created_at: string;
  photo_count: number;
  status?: string;
  thumbnail_url?: string;
  photos?: Array<{ count: number }>;
}

export function DashboardClient({ listings: initialListings, user }: { listings: Listing[]; user: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics'>('listings');
  const [listings, setListings] = useState(
    initialListings.map((listing) => ({
      ...listing,
      photo_count: listing.photo_count ?? listing.photos?.[0]?.count ?? 0,
    }))
  );
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredListings = listings.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const { data } = await supabase.from('listings').insert({ title: newProjectName, user_id: user.id }).select().single();

    if (data) {
      router.push(`/dashboard/studio?id=${data.id}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its photos?')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings(listings.filter((l) => l.id !== id));
    setMenuOpen(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      <aside className="w-[220px] bg-[#1A1A1A] border-r border-white/10 p-4 flex flex-col">
        <Link href="/" className="text-xl font-bold text-[#D4A017] mb-8">
          SnapR
        </Link>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left ${
              activeTab === 'listings' ? 'bg-[#D4A017]/10 text-[#D4A017]' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <FolderOpen className="w-5 h-5" /> My Listings
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left ${
              activeTab === 'analytics' ? 'bg-[#D4A017]/10 text-[#D4A017]' : 'text-white/60 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5" /> Analytics
          </button>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/5">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#D4A017]/20 flex items-center justify-center text-[#D4A017] font-medium">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/5 w-full">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'analytics' ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-white/50">Track your photo enhancement activity and savings</p>
            </div>
            <DashboardAnalytics userId={user.id} />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">My Listings</h1>
                <p className="text-white/50">{listings.length} projects</p>
              </div>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-medium hover:opacity-90"
              >
                <Plus className="w-5 h-5" /> New Project
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#D4A017] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="group relative bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/10 hover:border-[#D4A017]/50 transition-colors">
                  <Link href={`/dashboard/studio?id=${listing.id}`}>
                    <div className="aspect-[4/3] bg-[#0A0A0A] flex items-center justify-center">
                      {listing.thumbnail_url ? (
                        <img src={listing.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-white/20" />
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate mb-1">{listing.title}</h3>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{formatDate(listing.created_at)}</span>
                      <span className={`px-2 py-0.5 rounded-full ${listing.photo_count > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'}`}>
                        {listing.photo_count} photos
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(menuOpen === listing.id ? null : listing.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === listing.id && (
                    <div className="absolute top-10 right-2 bg-[#2A2A2A] rounded-lg shadow-xl border border-white/10 py-1 z-10">
                      <button
                        onClick={() => handleDeleteProject(listing.id)}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 w-full text-left text-sm"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredListings.length === 0 && (
              <div className="text-center py-16 text-white/40">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet. Create your first one!</p>
              </div>
            )}
          </>
        )}
      </main>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">New Project</h2>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl mb-4 focus:border-[#D4A017] outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl">
                Cancel
              </button>
              <button onClick={handleCreateProject} className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-medium">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
