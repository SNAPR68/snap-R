'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, FolderOpen, Settings, LogOut, Search, MoreVertical, Trash2, Image as ImageIcon } from 'lucide-react';

interface DashboardClientProps {
  user: any;
  listings: any[];
  profile: any;
}

export function DashboardClient({ user, listings, profile }: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredListings = listings.filter(l => l.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from('listings').insert({ user_id: user.id, title: newProjectName.trim() }).select().single();
    if (data) router.push(`/dashboard/studio?id=${data.id}`);
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#D4A017] to-[#FFD700] bg-clip-text text-transparent">SnapR</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#D4A017]/20 to-transparent text-[#D4A017]">
            <FolderOpen className="w-5 h-5" /> My Listings
          </button>
          <Link href="/dashboard/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/60">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-white/60">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">My Projects</h2>
          <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg font-medium text-black">
            <Plus className="w-5 h-5" /> New Project
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg focus:outline-none focus:border-[#D4A017]/50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Link key={listing.id} href={`/dashboard/studio?id=${listing.id}`} className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden hover:border-[#D4A017]/50 transition-all group">
              <div className="aspect-video bg-[#0F0F0F] flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-white/20" />
              </div>
              <div className="p-4">
                <h3 className="font-medium truncate">{listing.title}</h3>
                <p className="text-sm text-white/40 mt-1">{listing.photos?.[0]?.count || 0} photos</p>
              </div>
            </Link>
          ))}
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#1A1A1A] rounded-xl p-6 w-full max-w-md border border-white/10">
              <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
              <input type="text" placeholder="Project name (e.g., 123 Main Street)" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-4 py-3 bg-[#0F0F0F] border border-white/10 rounded-lg mb-4" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowNewProject(false)} className="flex-1 py-3 border border-white/20 rounded-lg">Cancel</button>
                <button onClick={handleCreateProject} disabled={creating || !newProjectName.trim()} className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg font-medium text-black disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
