'use client';

import { useState } from 'react';
import { Download, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface Photo {
  id: string;
  rawUrl: string;
  processedUrl: string;
  variant: string;
}

interface ShareViewProps {
  listing: { title: string };
  photos: Photo[];
  settings: {
    allow_download: boolean;
    show_comparison: boolean;
  };
}

export function ShareView({ listing, photos, settings }: ShareViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [approvedPhotos, setApprovedPhotos] = useState<Set<string>>(new Set());

  const selectedPhoto = photos[selectedIndex];

  const handleApprove = (photoId: string) => {
    setApprovedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
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

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <p>No enhanced photos available yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/snapr-logo.png" alt="SnapR" className="w-[76px] h-[76px]" />
          <span className="font-semibold">{listing.title}</span>
        </div>
        <div className="text-sm text-white/60">
          {approvedPhotos.size} of {photos.length} approved
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        <main className="flex-1 p-6 flex flex-col">
          <div className="flex-1 relative bg-[#0A0A0A] rounded-xl overflow-hidden">
            {settings.show_comparison && selectedPhoto.rawUrl ? (
              <div 
                className="relative w-full h-full cursor-ew-resize"
                onMouseMove={(e) => {
                  if (e.buttons !== 1) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 0), 100);
                  setSliderPosition(percent);
                }}
              >
                <img src={selectedPhoto.processedUrl} alt="Enhanced" className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                  <img src={selectedPhoto.rawUrl} alt="Original" className="h-full object-contain" style={{ width: `${100 / (sliderPosition / 100)}%` }} />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${sliderPosition}%` }}>
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-gray-600 text-xs">↔</span>
                  </div>
                </div>
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 rounded text-sm">Before</div>
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 rounded text-sm">After</div>
              </div>
            ) : (
              <img src={selectedPhoto.processedUrl} alt="Enhanced" className="w-full h-full object-contain" />
            )}

            {photos.length > 1 && (
              <>
                <button 
                  onClick={() => setSelectedIndex(i => Math.max(0, i - 1))}
                  disabled={selectedIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full disabled:opacity-30"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setSelectedIndex(i => Math.min(photos.length - 1, i + 1))}
                  disabled={selectedIndex === photos.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full disabled:opacity-30"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => handleApprove(selectedPhoto.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                approvedPhotos.has(selectedPhoto.id)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Check className="w-5 h-5" />
              {approvedPhotos.has(selectedPhoto.id) ? 'Approved' : 'Approve'}
            </button>
            {settings.allow_download && (
              <button
                onClick={() => handleDownload(selectedPhoto.processedUrl, `${listing.title}-${selectedIndex + 1}.jpg`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-medium text-black"
              >
                <Download className="w-5 h-5" /> Download
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto py-2 justify-center">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex ? 'border-[#D4A017]' : 'border-transparent hover:border-white/30'
                }`}
              >
                <img src={photo.processedUrl} alt="" className="w-full h-full object-cover" />
                {approvedPhotos.has(photo.id) && (
                  <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
