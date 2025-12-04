'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, FolderOpen, Settings, Trash2, Image as ImageIcon, ChevronRight, ChevronDown, X, GraduationCap, Camera, Loader2 } from 'lucide-react';
import { DashboardAnalytics } from './dashboard-analytics';

interface Project {
  id: string;
  title: string;
  created_at: string;
  listings?: Listing[];
}

interface Listing {
  id: string;
  title: string;
  project_id: string;
  created_at: string;
  photo_count?: number;
}

export function DashboardClient({ user, listings }: { user: any; listings?: any[] }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewListing, setShowNewListing] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newListingTitle, setNewListingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'analytics'>('projects');
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsData) {
      const projectsWithListings = await Promise.all(
        projectsData.map(async (project) => {
          const { data: listings } = await supabase
            .from('listings')
            .select('*, photos(count)')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });

          return {
            ...project,
            listings:
              listings?.map((l) => ({
                ...l,
                photo_count: l.photos?.[0]?.count || 0,
              })) || [],
          };
        })
      );

      setProjects(projectsWithListings);
    }

    setLoading(false);
  };

  const createProject = async () => {
    if (!newProjectTitle.trim()) return;

    const { data } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title: newProjectTitle.trim() })
      .select()
      .single();

    if (data) {
      setProjects([{ ...data, listings: [] }, ...projects]);
      setNewProjectTitle('');
      setShowNewProject(false);
      setExpandedProjects(new Set([...expandedProjects, data.id]));
    }
  };

  const createListing = async (projectId: string) => {
    if (!newListingTitle.trim()) return;

    const { data } = await supabase
      .from('listings')
      .insert({ user_id: user.id, project_id: projectId, title: newListingTitle.trim() })
      .select()
      .single();

    if (data) {
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, listings: [{ ...data, photo_count: 0 }, ...(p.listings || [])] }
            : p
        )
      );
      setNewListingTitle('');
      setShowNewListing(null);
      router.push('/dashboard/studio?id=' + data.id);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Delete this project and all its listings?')) return;
    await supabase.from('projects').delete().eq('id', projectId);
    setProjects(projects.filter((p) => p.id !== projectId));
  };

  const deleteListing = async (listingId: string, projectId: string) => {
    if (!confirm('Delete this listing and all its photos?')) return;
    await supabase.from('listings').delete().eq('id', listingId);
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? { ...p, listings: p.listings?.filter((l) => l.id !== listingId) }
          : p
      )
    );
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) newExpanded.delete(projectId);
    else newExpanded.add(projectId);
    setExpandedProjects(newExpanded);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Get or create a default project
      let projectId: string;
      
      if (projects.length > 0) {
        projectId = projects[0].id;
      } else {
        // Create a default project
        const { data: newProject } = await supabase
          .from('projects')
          .insert({ user_id: user.id, title: 'Quick Captures' })
          .select()
          .single();
        
        if (!newProject) throw new Error('Failed to create project');
        projectId = newProject.id;
      }

      // Create a new listing for this capture
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
      });
      
      const { data: newListing } = await supabase
        .from('listings')
        .insert({ 
          user_id: user.id, 
          project_id: projectId, 
          title: `Snap ${timestamp}` 
        })
        .select()
        .single();

      if (!newListing) throw new Error('Failed to create listing');

      // Upload the photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${newListing.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      // Save photo record
      await supabase.from('photos').insert({
        listing_id: newListing.id,
        user_id: user.id,
        original_url: publicUrl,
        storage_path: fileName,
      });

      // Navigate to studio with this listing
      router.push(`/dashboard/studio?id=${newListing.id}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/snapr-logo.png" alt="SnapR" className="w-[76px] h-[76px]" />
          <span className="text-2xl font-bold text-[#D4A017]">SnapR</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm hidden md:block">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-[260px] bg-[#1A1A1A] border-r border-white/10 p-4 flex flex-col">
          <nav className="flex-1 space-y-1">
            {/* Snap & Enhance - Direct Camera Trigger */}
            <label
              className="flex items-center gap-3 px-3 py-3 rounded-xl mb-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#D4A017]/25 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Snap & Enhance'}</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            
            <div className="border-b border-white/10 my-3" />
            
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left ${
                activeTab === 'projects'
                  ? 'bg-[#D4A017]/10 text-[#D4A017]'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <FolderOpen className="w-5 h-5" /> My Projects
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left ${
                activeTab === 'analytics'
                  ? 'bg-[#D4A017]/10 text-[#D4A017]'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-5 h-5" /> Analytics
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/5"
            >
              <Settings className="w-5 h-5" /> Settings
            </Link>
            <Link
              href="/academy"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/5"
            >
              <GraduationCap className="w-5 h-5" /> SnapR Academy
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'analytics' ? (
            <DashboardAnalytics />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold hover:opacity-90 shadow-lg shadow-[#D4A017]/25"
                >
                  <Plus className="w-5 h-5" /> New Project
                </button>
              </div>

              {showNewProject && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Create New Project</h2>
                      <button
                        onClick={() => setShowNewProject(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project name"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createProject()}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#D4A017] mb-4"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowNewProject(false)}
                        className="flex-1 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createProject}
                        disabled={!newProjectTitle.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showNewListing && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                  <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Create New Listing</h2>
                      <button
                        onClick={() => setShowNewListing(null)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Listing name"
                      value={newListingTitle}
                      onChange={(e) => setNewListingTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createListing(showNewListing)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#D4A017] mb-4"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowNewListing(null)}
                        className="flex-1 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => createListing(showNewListing)}
                        disabled={!newListingTitle.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center text-white/60 py-12">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-16">
                  <FolderOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                  <p className="text-white/60 mb-6">Create your first project to get started</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold"
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedProjects.has(project.id) ? (
                            <ChevronDown className="w-5 h-5 text-[#D4A017]" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-white/60" />
                          )}
                          <FolderOpen className="w-5 h-5 text-[#D4A017]" />
                          <span className="font-semibold">{project.title}</span>
                          <span className="text-white/40 text-sm">({project.listings?.length || 0} listings)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNewListing(project.id);
                            }}
                            className="px-3 py-1.5 bg-[#D4A017]/20 text-[#D4A017] rounded-lg text-sm hover:bg-[#D4A017]/30"
                          >
                            + Add Listing
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project.id);
                            }}
                            className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedProjects.has(project.id) && (
                        <div className="border-t border-white/10">
                          {project.listings && project.listings.length > 0 ? (
                            project.listings.map((listing) => (
                              <div
                                key={listing.id}
                                className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-white/5 border-b border-white/5 last:border-0"
                              >
                                <Link
                                  href={'/dashboard/studio?id=' + listing.id}
                                  className="flex items-center gap-3 flex-1"
                                >
                                  <ImageIcon className="w-4 h-4 text-white/40" />
                                  <span>{listing.title}</span>
                                  <span className="text-white/40 text-sm">({listing.photo_count} photos)</span>
                                </Link>
                                <button
                                  onClick={() => deleteListing(listing.id, project.id)}
                                  className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 pl-12 text-white/40 text-sm">
                              No listings yet. Click "+ Add Listing" to create one.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
