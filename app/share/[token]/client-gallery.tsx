'use client';

import { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { ClientApprovalButtons } from '@/components/client-approval-buttons';

interface Photo {
  id: string;
  url: string;
  originalUrl?: string;
  variant?: string;
  client_approved?: boolean | null;
  client_feedback?: string | null;
}

interface ClientGalleryProps {
  photos: Photo[];
  listingTitle: string;
  shareToken: string;
  allowDownload: boolean;
  showComparison: boolean;
}

export function ClientGallery({ photos, listingTitle, shareToken, allowDownload, showComparison }: ClientGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBefore, setShowBefore] = useState(false);
  const [approvalCounts, setApprovalCounts] = useState({
    approved: photos.filter(p => p.client_approved === true).length,
    rejected: photos.filter(p => p.client_approved === false).length,
  });

  const selectedPhoto = photos[selectedIndex];

  const handleApprovalUpdate = (photoId: string, approved: boolean | null) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    // Update counts
    if (photo.client_approved === true) setApprovalCounts(c => ({ ...c, approved: c.approved - 1 }));
    if (photo.client_approved === false) setApprovalCounts(c => ({ ...c, rejected: c.rejected - 1 }));
    if (approved === true) setApprovalCounts(c => ({ ...c, approved: c.approved + 1 }));
    if (approved === false) setApprovalCounts(c => ({ ...c, rejected: c.rejected + 1 }));

    photo.client_approved = approved;
  };

  const goNext = () => setSelectedIndex(i => (i + 1) % photos.length);
  const goPrev = () => setSelectedIndex(i => (i - 1 + photos.length) % photos.length);

  const handleDownload = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${listingTitle}-${selectedIndex + 1}.jpg`;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-white/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{listingTitle}</h1>
            <p className="text-sm text-white/50">{photos.length} photos for review</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-green-400">
                <Check className="w-4 h-4" /> {approvalCounts.approved}
              </span>
              <span className="text-white/30">|</span>
              <span className="flex items-center gap-1 text-red-400">
                <X className="w-4 h-4" /> {approvalCounts.rejected}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-white/50">{photos.length - approvalCounts.approved - approvalCounts.rejected} pending</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          {/* Main Image */}
          <div className="relative">
            <div className="aspect-[4/3] bg-[#1A1A1A] rounded-xl overflow-hidden relative">
              <img
                src={showBefore && showComparison && selectedPhoto.originalUrl ? selectedPhoto.originalUrl : selectedPhoto.url}
                alt=""
                className="w-full h-full object-contain"
              />
              
              {/* Navigation */}
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Before/After toggle */}
              {showComparison && selectedPhoto.originalUrl && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-black/70 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowBefore(false)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${!showBefore ? 'bg-[#D4A017] text-black' : 'text-white/60'}`}
                  >
                    After
                  </button>
                  <button
                    onClick={() => setShowBefore(true)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${showBefore ? 'bg-[#D4A017] text-black' : 'text-white/60'}`}
                  >
                    Before
                  </button>
                </div>
              )}

              {/* Photo counter */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 rounded-lg text-sm">
                {selectedIndex + 1} / {photos.length}
              </div>

              {/* Variant tag */}
              {selectedPhoto.variant && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-[#D4A017] rounded-lg text-sm text-black font-medium">
                  {selectedPhoto.variant}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4">
              <ClientApprovalButtons
                photoId={selectedPhoto.id}
                shareToken={shareToken}
                initialApproved={selectedPhoto.client_approved}
                initialFeedback={selectedPhoto.client_feedback}
                onUpdate={(approved) => handleApprovalUpdate(selectedPhoto.id, approved)}
              />
              
              {allowDownload && (
                <button
                  onClick={() => handleDownload(selectedPhoto.url)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/60">All Photos</h3>
            <div className="grid grid-cols-3 gap-2 max-h-[600px] overflow-y-auto pr-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === index ? 'border-[#D4A017]' : 'border-transparent hover:border-white/30'
                  }`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  
                  {/* Approval indicator */}
                  {photo.client_approved !== null && (
                    <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                      photo.client_approved ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {photo.client_approved ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}

                  {/* Index */}
                  <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
