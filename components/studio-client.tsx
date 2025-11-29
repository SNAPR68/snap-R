'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Upload, Sun, Moon, Leaf, Trash2, Sofa, Sparkles, Maximize, Wand2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const AI_TOOLS = [
  { id: 'sky-replacement', name: 'Sky Replacement', icon: Sun, credits: 1, category: 'EXTERIOR' },
  { id: 'virtual-twilight', name: 'Virtual Twilight', icon: Moon, credits: 2, category: 'EXTERIOR' },
  { id: 'lawn-repair', name: 'Lawn Repair', icon: Leaf, credits: 1, category: 'EXTERIOR' },
  { id: 'declutter', name: 'Declutter', icon: Trash2, credits: 2, category: 'INTERIOR' },
  { id: 'virtual-staging', name: 'Virtual Staging', icon: Sofa, credits: 3, category: 'INTERIOR' },
  { id: 'hdr', name: 'HDR Enhancement', icon: Sparkles, credits: 1, category: 'ENHANCE' },
  { id: 'upscale', name: 'Upscale 2x', icon: Maximize, credits: 2, category: 'ENHANCE' },
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

  useEffect(() => {
    loadData();
  }, [listingId]);

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
      if (photosWithUrls.length && !selectedPhoto) setSelectedPhoto(photosWithUrls[0]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const path = `${listingId}/${Date.now()}-${file.name}`;
      await supabase.storage.from('raw-images').upload(path, file);
      await supabase.from('photos').insert({ listing_id: listingId, raw_url: path, status: 'pending' });
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
      if (data.success) loadData();
    } catch (error) {
      console.error('Enhancement failed:', error);
    }

    setProcessing(false);
    setActiveTool(null);
  };

  const categories = [...new Set(AI_TOOLS.map(t => t.category))];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-semibold">{listing?.title || 'Loading...'}</h1>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg cursor-pointer text-black font-medium">
          <Upload className="w-4 h-4" /> Upload
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </header>

      <div className="flex-1 flex">
        {/* Left - Tools */}
        <aside className="w-64 bg-[#1A1A1A] border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white/40 mb-4">AI TOOLS</h3>
          {categories.map(category => (
            <div key={category} className="mb-4">
              <button onClick={() => setExpandedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])} className="flex items-center justify-between w-full text-sm font-medium text-white/60 mb-2">
                {category}
                {expandedCategories.includes(category) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedCategories.includes(category) && (
                <div className="space-y-1">
                  {AI_TOOLS.filter(t => t.category === category).map(tool => (
                    <button key={tool.id} onClick={() => handleEnhance(tool.id)} disabled={processing || !selectedPhoto} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all ${activeTool === tool.id ? 'bg-[#D4A017]/20 text-[#D4A017]' : 'hover:bg-white/5'} disabled:opacity-50`}>
                      {processing && activeTool === tool.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <tool.icon className="w-4 h-4" />}
                      {tool.name}
                      <span className="ml-auto text-xs text-white/40">{tool.credits}cr</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* Center - Image */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 bg-[#0A0A0A]">
            {selectedPhoto ? (
              <div className="relative w-full h-full max-w-4xl">
                <Image src={selectedPhoto.signedProcessedUrl || selectedPhoto.signedRawUrl} alt="" fill className="object-contain" />
                {processing && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-[#D4A017] mx-auto mb-4" />
                      <p className="text-[#D4A017]">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-white/40">
                <Upload className="w-16 h-16 mx-auto mb-4" />
                <p>Upload images to get started</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="h-24 bg-[#1A1A1A] border-t border-white/10 flex items-center gap-2 px-4 overflow-x-auto">
            {photos.map(photo => (
              <button key={photo.id} onClick={() => setSelectedPhoto(photo)} className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${selectedPhoto?.id === photo.id ? 'border-[#D4A017]' : 'border-transparent'}`}>
                <Image src={photo.signedRawUrl} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
