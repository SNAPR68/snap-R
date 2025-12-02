'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HumanEditRequestModal } from "./human-edit-request";
import Link from 'next/link';
import { ArrowLeft, Upload, Sun, Moon, Leaf, Trash2, Sofa, Sparkles, Wand2, Loader2, ChevronDown, ChevronUp, Check, X, Download, Share2, Copy, LogOut, UserCheck } from 'lucide-react';

const AI_TOOLS = [
  { id: 'sky-replacement', name: 'Sky Replacement', icon: Sun, credits: 1, category: 'EXTERIOR' },
  { id: 'virtual-twilight', name: 'Virtual Twilight', icon: Moon, credits: 2, category: 'EXTERIOR' },
  { id: 'lawn-repair', name: 'Lawn Repair', icon: Leaf, credits: 1, category: 'EXTERIOR' },
  { id: 'declutter', name: 'Declutter', icon: Trash2, credits: 2, category: 'INTERIOR' },
  { id: 'virtual-staging', name: 'Virtual Staging', icon: Sofa, credits: 3, category: 'INTERIOR' },
  { id: 'hdr', name: 'HDR Enhancement', icon: Sparkles, credits: 1, category: 'ENHANCE' },
  { id: 'auto-enhance', name: 'Auto Enhance', icon: Wand2, credits: 1, category: 'ENHANCE' },
];

export function StudioClient({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['EXTERIOR', 'INTERIOR', 'ENHANCE']);
  type PendingEnhancement = {
    originalUrl: string;
    enhancedUrl: string;
    toolId: string;
    photoId: string;
  };

  const [pendingEnhancement, setPendingEnhancement] = useState<PendingEnhancement | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [completedPhotos, setCompletedPhotos] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHumanEditModal, setShowHumanEditModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    allowDownload: true,
    showComparison: true,
  });

  useEffect(() => { loadData(); }, [listingId]);

  useEffect(() => {
    if (!showShareModal) {
      setShareLoading(false);
    }
  }, [showShareModal]);

  useEffect(() => {
    if (!showShareModal) return;
    let cancelled = false;
    const generateLink = async () => {
      try {
        setShareLoading(true);
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            options: {
              allowDownload: shareOptions.allowDownload,
              showComparison: shareOptions.showComparison,
            },
          }),
        });
        const data = await res.json();
        if (!cancelled) {
          if (data.success && data.shareUrl) {
            setShareLink(data.shareUrl);
          } else {
            console.error('[Share] Failed to create link', data?.error);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[Share] Error creating link', error);
        }
      } finally {
        if (!cancelled) setShareLoading(false);
      }
    };
    generateLink();
    return () => { cancelled = true; };
  }, [showShareModal, shareOptions.allowDownload, shareOptions.showComparison, listingId]);

  const loadData = async () => {
    const { data: listingData } = await supabase.from('listings').select('*').eq('id', listingId).single();
    setListing(listingData);

    const { data: photosData } = await supabase.from('photos').select('*').eq('listing_id', listingId).order('created_at', { ascending: false });
    
    if (photosData) {
      const photosWithUrls = await Promise.all(photosData.map(async (photo) => {
        const { data: signedUrl } = await supabase.storage.from('raw-images').createSignedUrl(photo.raw_url, 3600);
        let processedSignedUrl = null;
        if (photo.processed_url) {
          const { data } = await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url, 3600);
          processedSignedUrl = data?.signedUrl;
        }
        return { ...photo, signedRawUrl: signedUrl?.signedUrl, signedProcessedUrl: processedSignedUrl };
      }));
      setPhotos(photosWithUrls);
      setCompletedPhotos(photosWithUrls.filter(p => p.status === 'completed' && p.signedProcessedUrl));
      if (photosWithUrls.length && !selectedPhoto) setSelectedPhoto(photosWithUrls[0]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const path = `${listingId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('raw-images').upload(path, file);
      if (!uploadError) {
        await supabase.from('photos').insert({ listing_id: listingId, raw_url: path, status: 'pending' });
      }
    }
    loadData();
  };

  const handleEnhance = async (toolId: string) => {
    if (!selectedPhoto || processing) return;
    setProcessing(true);
    setActiveTool(toolId);

    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: selectedPhoto.id, toolId }),
      });
      const data = await res.json();
      
      if (data.success && data.enhancedUrl) {
        setPendingEnhancement({
          originalUrl: selectedPhoto.signedRawUrl,
          enhancedUrl: data.enhancedUrl,
          toolId,
          photoId: selectedPhoto.id,
        });
        setSliderPosition(50);
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
    }
    setProcessing(false);
    setActiveTool(null);
  };

  const handleAcceptEnhancement = async () => {
    if (!pendingEnhancement) return;
    await supabase.from('photos').update({ status: 'completed' }).eq('id', pendingEnhancement.photoId);
    setPendingEnhancement(null);
    loadData();
  };

  const handleShare = () => {
    setShareLink('');
    setShowShareModal(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const handleDownload = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleDeleteListing = async () => {
    if (!confirm('Delete this entire listing and all photos? This cannot be undone.')) return;
    await supabase.from('photos').delete().eq('listing_id', listingId);
    await supabase.from('listings').delete().eq('id', listingId);
    window.location.href = '/dashboard';
  };

  const handleDeletePhoto = async (photoId: string, rawUrl: string) => {
    if (!confirm('Delete this original photo?')) return;
    await supabase.storage.from('raw-images').remove([rawUrl]);
    await supabase.from('photos').delete().eq('id', photoId);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
    loadData();
  };

  const handleDeleteEnhanced = async (photoId: string, processedUrl: string) => {
    if (!confirm('Delete this enhanced photo?')) return;
    await supabase.storage.from('raw-images').remove([processedUrl]);
    await supabase.from('photos').update({ processed_url: null, status: 'pending' }).eq('id', photoId);
    loadData();
  };

  const categories = [...new Set(AI_TOOLS.map(t => t.category))];

  return (
    <div className="h-screen bg-[#0F0F0F] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link><Link href="/" className="flex items-center gap-2"><img src="/snapr-logo.png" alt="SnapR" className="w-7 h-7" /></Link>
          <h1 className="font-semibold truncate max-w-[200px]">{listing?.title || 'Loading...'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm disabled:opacity-50"
          >
            {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share Gallery
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg cursor-pointer text-black font-medium text-sm">
            <Upload className="w-4 h-4" /> Upload
            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </header>

      {/* Main Content - Fixed Height */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Tools */}
        <aside className="w-[200px] bg-[#1A1A1A] border-r border-white/10 flex flex-col flex-shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            <h2 className="text-sm font-bold text-white/80 mb-4">AI TOOLS</h2>
            {categories.map(category => (
              <div key={category} className="mb-3">
                <button
                  onClick={() =>
                    setExpandedCategories(prev =>
                      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category],
                    )
                  }
                  className="flex items-center justify-between w-full text-sm font-semibold text-white/80 mb-2"
                >
                  {category}
                  {expandedCategories.includes(category) ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                {expandedCategories.includes(category) && (
                  <div className="space-y-1">
                    {AI_TOOLS.filter(t => t.category === category).map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => handleEnhance(tool.id)}
                        disabled={processing || !selectedPhoto}
                        className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs transition-all ${
                          activeTool === tool.id
                            ? 'bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black'
                            : 'hover:bg-white/10 text-white/80'
                        } disabled:opacity-50`}
                      >
                        <span className="flex items-center gap-2">
                          {activeTool === tool.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <tool.icon className="w-3 h-3" />
                          )}
                          <span className="truncate">{tool.name}</span>
                        </span>
                        <span className="text-[10px] opacity-60">{tool.credits}cr</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 space-y-2">
            <button
              onClick={() => setShowHumanEditModal(true)}
              disabled={!selectedPhoto}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#D4A017]/10 hover:bg-[#D4A017]/20 border border-[#D4A017]/30 rounded-lg text-sm text-[#D4A017] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="w-4 h-4" /> Request Human Edit
            </button>
            <button
              onClick={handleDeleteListing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Listing
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/auth/login';
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Center - Image */}
        <main className="flex-1 flex flex-col p-4 min-w-0">
          {selectedPhoto ? (
            <>
              <div className="flex-1 relative flex items-center justify-center bg-[#0A0A0A] rounded-xl overflow-hidden min-h-0">
                {pendingEnhancement ? (
                  <div 
                    className="absolute inset-0 cursor-ew-resize select-none"
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const updatePosition = (clientX: number) => {
                        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                        setSliderPosition((x / rect.width) * 100);
                      };
                      updatePosition(e.clientX);
                      const onMouseMove = (event: MouseEvent) => updatePosition(event.clientX);
                      const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                      };
                      window.addEventListener('mousemove', onMouseMove);
                      window.addEventListener('mouseup', onMouseUp);
                    }}
                  >
                    <img 
                      src={pendingEnhancement.enhancedUrl} 
                      alt="Enhanced" 
                      className="absolute inset-0 w-full h-full object-contain"
                      draggable={false}
                    />
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={pendingEnhancement.originalUrl} 
                        alt="Original" 
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ maxWidth: 'none', width: `${sliderPosition === 0 ? 0 : 100 / (sliderPosition / 100)}%` }}
                        draggable={false}
                      />
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                      style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-ew-resize">
                        <span className="text-gray-600 text-sm font-bold">↔</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 rounded-lg text-sm font-medium">Before</div>
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 rounded-lg text-sm font-medium">After</div>
                  </div>
                ) : (
                  <img src={selectedPhoto.signedRawUrl} alt="Selected" className="max-w-full max-h-full object-contain" />
                )}
                {processing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#D4A017] mb-2" />
                    <p>Processing...</p>
                  </div>
                )}
              </div>

              {pendingEnhancement && (
                <div className="flex items-center justify-center gap-3 mt-3 flex-shrink-0">
                  <button onClick={() => setPendingEnhancement(null)} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    <X className="w-4 h-4" /> Reset
                  </button>
                  <button onClick={handleAcceptEnhancement} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-lg text-white text-sm">
                    <Check className="w-4 h-4" /> Accept
                  </button>
                </div>
              )}

              <div className="flex gap-2 mt-3 overflow-x-auto py-1 flex-shrink-0">
                {photos.map(photo => (
                  <div key={photo.id} className="relative flex-shrink-0 group">
                    <button
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setPendingEnhancement(null);
                      }}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedPhoto?.id === photo.id ? 'border-[#D4A017]' : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img src={photo.signedRawUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id, photo.raw_url);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center text-white hidden group-hover:flex"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40">
              <Upload className="w-12 h-12 mb-3" />
              <p>Upload images to get started</p>
            </div>
          )}
        </main>

        {/* Right Sidebar - Downloads */}
        <aside className="w-[200px] bg-[#1A1A1A] border-l border-white/10 p-3 overflow-y-auto flex-shrink-0">
          <h2 className="text-xs font-semibold text-white/40 mb-3">READY FOR DOWNLOAD</h2>
          {completedPhotos.length === 0 ? (
            <div className="text-center text-white/30 py-6">
              <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Enhanced photos appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="bg-[#0F0F0F] rounded-lg overflow-hidden border border-white/10 group relative"
                >
                  <button
                    onClick={() => handleDeleteEnhanced(photo.id, photo.processed_url)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center text-white hidden group-hover:flex z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="aspect-video relative">
                    <img src={photo.signedProcessedUrl} alt="" className="w-full h-full object-cover" />
                    {photo.variant && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#D4A017] rounded text-[10px] text-black">
                        {photo.variant}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload(photo.signedProcessedUrl, `enhanced-${photo.id}.jpg`)}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black text-xs font-medium"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Share2 className="w-5 h-5" /> Share with Client</h2>
            <p className="text-white/60 text-sm mb-4">Send this link to get instant approval before downloading.</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                placeholder={shareLoading ? 'Generating link...' : 'Share link will appear here'}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm"
              />
              <button
                onClick={copyLink}
                disabled={!shareLink}
                className="px-4 py-3 bg-[#D4A017] rounded-xl text-black disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareOptions.allowDownload}
                  onChange={(e) => setShareOptions((prev) => ({ ...prev, allowDownload: e.target.checked }))}
                  className="accent-[#D4A017]"
                />
                <span>Allow client to download</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareOptions.showComparison}
                  onChange={(e) => setShareOptions((prev) => ({ ...prev, showComparison: e.target.checked }))}
                  className="accent-[#D4A017]"
                />
                <span>Show before/after comparison</span>
              </label>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-4 py-3 border border-white/20 rounded-xl">Close</button>
          </div>
        </div>
      )}
      {showHumanEditModal && selectedPhoto && (
        <HumanEditRequestModal
          imageId={selectedPhoto.id}
          photoUrl={selectedPhoto.signedUrl}
          userId={listing?.user_id}
          onClose={() => setShowHumanEditModal(false)}
        />
      )}
    </div>
  );
}
