'use client';

import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import JSZip from 'jszip';
import { 
  Loader2, Home, ChevronRight, Upload, Sparkles, Download,
  Eye, Link2, Trash2, Edit3, Plus, Image, ExternalLink, Copy, Check,
  Camera, X, GripVertical, Play, Pause, ChevronLeft, RotateCcw,
  Share2, Globe, Lock, Users, Settings, Grid, List, Calendar,
  CheckCircle, AlertCircle, Info, Package
} from 'lucide-react';
import Link from 'next/link';

interface TourScene {
  id: string;
  name: string;
  image_url: string;
  order_index: number;
}

interface Tour {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  listing_id?: string;
  tour_scenes?: TourScene[];
}

// Download helper - downloads all tour photos as ZIP
async function downloadTourPhotosAsZip(tour: Tour) {
  if (!tour.tour_scenes || tour.tour_scenes.length === 0) return;
  
  const zip = new JSZip();
  const folder = zip.folder(tour.name || 'gallery');
  
  // Download each photo and add to ZIP
  for (let i = 0; i < tour.tour_scenes.length; i++) {
    const scene = tour.tour_scenes[i];
    try {
      const response = await fetch(scene.image_url);
      if (!response.ok) throw new Error('Failed to fetch');
      const blob = await response.blob();
      const fileName = `${scene.name || `photo-${i + 1}`}.jpg`;
      folder?.file(fileName, blob);
    } catch (e) {
      console.error('Failed to add to ZIP:', scene.name, e);
      // Try alternate method - download via canvas if image is already loaded
    }
  }
  
  // Generate and download ZIP
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tour.name || 'gallery'}-photos.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (e) {
    console.error('ZIP generation failed:', e);
    // Fallback: download individually
    await downloadTourPhotosIndividually(tour);
  }
}

// Fallback: Download photos individually
async function downloadTourPhotosIndividually(tour: Tour) {
  if (!tour.tour_scenes || tour.tour_scenes.length === 0) return;
  
  for (let i = 0; i < tour.tour_scenes.length; i++) {
    const scene = tour.tour_scenes[i];
    try {
      // Try fetch first
      const response = await fetch(scene.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tour.name}-${scene.name || `photo-${i + 1}`}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      // Fallback: open image in new tab
      window.open(scene.image_url, '_blank');
    }
  }
}

// Tour Card Component
function TourCard({ tour, onView, onEdit, onDelete }: { 
  tour: Tour; 
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const tourUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tour/${tour.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(tourUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    await downloadTourPhotosAsZip(tour);
    setDownloading(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      {/* Cover Image */}
      <div className="aspect-video bg-white/5 relative">
        {tour.cover_image_url || tour.tour_scenes?.[0]?.image_url ? (
          <img 
            src={tour.cover_image_url || tour.tour_scenes?.[0]?.image_url} 
            alt={tour.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {tour.is_published ? (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              Live
            </span>
          ) : (
            <span className="px-2 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
              Draft
            </span>
          )}
        </div>
        
        {/* Photo Count */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
          {tour.tour_scenes?.length || 0} photos
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{tour.name}</h3>
        <div className="flex items-center gap-3 text-xs text-white/50 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {tour.view_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(tour.updated_at || tour.created_at).toLocaleDateString()}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Download as ZIP"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Create/Edit Tour Modal
function TourModal({ 
  tour, 
  listingId,
  onClose, 
  onSave 
}: { 
  tour?: Tour;
  listingId?: string;
  onClose: () => void;
  onSave: (tour: Tour) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(tour?.name || '');
  const [description, setDescription] = useState(tour?.description || '');
  const [scenes, setScenes] = useState<TourScene[]>(tour?.tour_scenes || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newScenes: TourScene[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `tour-${Date.now()}-${i}.${file.name.split('.').pop()}`;
      
      try {
        const { data, error } = await supabase.storage
          .from('tour-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('tour-images')
          .getPublicUrl(fileName);

        newScenes.push({
          id: `temp-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          image_url: urlData.publicUrl,
          order_index: scenes.length + i
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setScenes([...scenes, ...newScenes]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeScene = (id: string) => {
    setScenes(scenes.filter(s => s.id !== id));
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === scenes.length - 1) return;

    const newScenes = [...scenes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newScenes[index], newScenes[targetIndex]] = [newScenes[targetIndex], newScenes[index]];
    newScenes.forEach((s, i) => s.order_index = i);
    setScenes(newScenes);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      if (tour) {
        // Update existing tour
        const { data: updatedTour, error } = await supabase
          .from('virtual_tours')
          .update({
            name,
            description,
            cover_image_url: scenes[0]?.image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', tour.id)
          .select()
          .single();

        if (error) throw error;

        // Update scenes
        await supabase.from('tour_scenes').delete().eq('tour_id', tour.id);
        
        if (scenes.length > 0) {
          const { error: scenesError } = await supabase
            .from('tour_scenes')
            .insert(scenes.map((s, i) => ({
              tour_id: tour.id,
              name: s.name,
              image_url: s.image_url,
              order_index: i
            })));

          if (scenesError) throw scenesError;
        }

        onSave({ ...updatedTour, tour_scenes: scenes });
      } else {
        // Create new tour
        const { data: newTour, error } = await supabase
          .from('virtual_tours')
          .insert({
            user_id: user.id,
            listing_id: listingId || null,
            name,
            slug,
            description,
            cover_image_url: scenes[0]?.image_url,
            is_published: true
          })
          .select()
          .single();

        if (error) throw error;

        // Add scenes
        if (scenes.length > 0) {
          const { error: scenesError } = await supabase
            .from('tour_scenes')
            .insert(scenes.map((s, i) => ({
              tour_id: newTour.id,
              name: s.name,
              image_url: s.image_url,
              order_index: i
            })));

          if (scenesError) throw scenesError;
        }

        onSave({ ...newTour, tour_scenes: scenes });
      }

      onClose();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">{tour ? 'Edit Gallery' : 'Create Gallery'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name & Description */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Gallery Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 123 Main Street Photos"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the property..."
              rows={2}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-amber-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-white/60">Photos ({scenes.length})</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Photos
              </button>
            </div>

            {scenes.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-white/30" />
                <p className="text-white/50 text-sm">Click to upload photos</p>
                <p className="text-white/30 text-xs mt-1">JPG, PNG, WebP accepted</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="relative group aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img src={scene.image_url} alt={scene.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => moveScene(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 bg-white/20 rounded hover:bg-white/30 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeScene(scene.id)}
                        className="p-1.5 bg-red-500/50 rounded hover:bg-red-500/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveScene(index, 'down')}
                        disabled={index === scenes.length - 1}
                        className="p-1.5 bg-white/20 rounded hover:bg-white/30 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="text-[10px] text-white/80">{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || scenes.length === 0 || saving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {tour ? 'Save Changes' : 'Create Gallery'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Tour Viewer Component
function TourViewer({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const scenes = tour.tour_scenes || [];

  const handleDownload = async () => {
    setDownloading(true);
    await downloadTourPhotosAsZip(tour);
    setDownloading(false);
  };

  if (scenes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-white/50">No photos in this gallery</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">{tour.name}</h2>
            <p className="text-sm text-white/50">{currentIndex + 1} / {scenes.length}</p>
          </div>
        </div>
        
        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download All Photos
            </>
          )}
        </button>
      </div>

      {/* Main Image */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        <img
          src={scenes[currentIndex].image_url}
          alt={scenes[currentIndex].name}
          className="max-w-full max-h-full object-contain"
        />

        {/* Navigation */}
        {scenes.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="absolute left-4 p-3 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentIndex(i => Math.min(scenes.length - 1, i + 1))}
              disabled={currentIndex === scenes.length - 1}
              className="absolute right-4 p-3 bg-black/60 rounded-full hover:bg-black/80 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex-shrink-0 p-4 bg-black/80 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto justify-center">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-amber-500' : 'border-transparent hover:border-white/30'
              }`}
            >
              <img src={scene.image_url} alt={scene.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Content
function VirtualToursContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [tours, setTours] = useState<Tour[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTour, setEditTour] = useState<Tour | undefined>();
  const [viewTour, setViewTour] = useState<Tour | undefined>();
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Load tours with scenes
      const { data: toursData, error: toursError } = await supabase
        .from('virtual_tours')
        .select(`
          *,
          tour_scenes (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (toursError) throw toursError;

      // Sort scenes by order_index
      const sortedTours = (toursData || []).map(tour => ({
        ...tour,
        tour_scenes: (tour.tour_scenes || []).sort((a: TourScene, b: TourScene) => a.order_index - b.order_index)
      }));

      setTours(sortedTours);

      // Load listings for "Create from Listing"
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, address, photos(id, raw_url, processed_url, status)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setListings(listingsData || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFromListing = async (listing: any) => {
    // Pre-fill photos from listing
    const photos = listing.photos?.map((p: any, i: number) => ({
      id: `listing-${i}`,
      name: `Photo ${i + 1}`,
      image_url: p.processed_url || p.raw_url,
      order_index: i
    })) || [];

    setSelectedListingId(listing.id);
    setEditTour({
      id: '',
      name: listing.title || listing.address || 'Property Gallery',
      slug: '',
      is_published: true,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      listing_id: listing.id,
      tour_scenes: photos
    } as any);
    setShowModal(true);
  };

  const handleDelete = async (tour: Tour) => {
    if (!confirm('Delete this gallery? This cannot be undone.')) return;

    try {
      await supabase.from('tour_scenes').delete().eq('tour_id', tour.id);
      await supabase.from('virtual_tours').delete().eq('id', tour.id);
      setTours(tours.filter(t => t.id !== tour.id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSave = (saved: Tour) => {
    if (editTour?.id) {
      setTours(tours.map(t => t.id === saved.id ? saved : t));
    } else {
      setTours([saved, ...tours]);
    }
    setShowModal(false);
    setEditTour(undefined);
    setSelectedListingId(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0F0F0F]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Property Gallery</h1>
              <p className="text-white/50 text-sm mt-1">
                Create beautiful, shareable photo galleries for your listings. Get a unique link to share with clients, embed on your website, or post on social media. Track views and engagement.
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-green-400">FREE</span>
              <p className="text-sm text-white/50 mt-1">Included in all plans</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-amber-400">Instant</span>
              <p className="text-sm text-white/50 mt-1">Creation</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-blue-400">Unlimited</span>
              <p className="text-sm text-white/50 mt-1">Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Your Galleries */}
        {tours.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Your Galleries</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map(tour => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onView={() => setViewTour(tour)}
                  onEdit={() => {
                    setEditTour(tour);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(tour)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create New */}
        <h2 className="text-xl font-bold mb-4">Create New Gallery</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* From Listing */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-400" />
              From Existing Listing
            </h3>
            
            {listings.length === 0 ? (
              <p className="text-white/50 text-sm">No listings yet. Create a listing first to use its photos.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {listings.map(listing => (
                  <button
                    key={listing.id}
                    onClick={() => handleCreateFromListing(listing)}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    {listing.photos?.[0] ? (
                      <img 
                        src={listing.photos[0].enhanced_url || listing.photos[0].url} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <Image className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.title || listing.address}</p>
                      <p className="text-xs text-white/50">{listing.photos?.length || 0} photos</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload New */}
          <div 
            onClick={() => {
              setEditTour(undefined);
              setSelectedListingId(undefined);
              setShowModal(true);
            }}
            className="bg-white/5 border border-white/10 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all min-h-[200px]"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="font-semibold mb-1">Upload Photos</h3>
            <p className="text-white/50 text-sm text-center">
              Regular photos or 360° panoramas
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <TourModal
          tour={editTour?.id ? editTour : undefined}
          listingId={selectedListingId}
          onClose={() => {
            setShowModal(false);
            setEditTour(undefined);
            setSelectedListingId(undefined);
          }}
          onSave={handleSave}
        />
      )}

      {viewTour && (
        <TourViewer
          tour={viewTour}
          onClose={() => setViewTour(undefined)}
        />
      )}
    </div>
  );
}

export default function VirtualToursPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <VirtualToursContent />
    </Suspense>
  );
}
