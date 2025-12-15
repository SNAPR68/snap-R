'use client';

import { useState, useEffect } from 'react';
import { Download, Check, X, ChevronLeft, ChevronRight, MessageSquare, Send, Loader2 } from 'lucide-react';

interface Photo {
  id: string;
  rawUrl: string;
  processedUrl: string;
  variant: string;
  clientApproved?: boolean | null;
  clientFeedback?: string | null;
}

interface ShareViewProps {
  listing: { title: string };
  photos: Photo[];
  settings: {
    allow_download: boolean;
    show_comparison: boolean;
    allow_approval?: boolean;
  };
  shareToken?: string;
}

export function ShareView({ listing, photos, settings, shareToken }: ShareViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, 'approved' | 'rejected' | null>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const selectedPhoto = photos[selectedIndex];

  useEffect(() => {
    const initialStatus: Record<string, 'approved' | 'rejected' | null> = {};
    const initialFeedback: Record<string, string> = {};
    
    photos.forEach(photo => {
      if (photo.clientApproved === true) {
        initialStatus[photo.id] = 'approved';
      } else if (photo.clientApproved === false) {
        initialStatus[photo.id] = 'rejected';
      } else {
        initialStatus[photo.id] = null;
      }
      initialFeedback[photo.id] = photo.clientFeedback || '';
    });
    
    setApprovalStatus(initialStatus);
    setFeedbackText(initialFeedback);
  }, [photos]);

  const handleApproval = async (photoId: string, approved: boolean) => {
    if (!shareToken) return;
    
    setSaving(photoId);
    
    try {
      const response = await fetch('/api/approve-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          shareToken,
          approved,
          feedback: feedbackText[photoId] || null,
        }),
      });

      if (response.ok) {
        setApprovalStatus(prev => ({
          ...prev,
          [photoId]: approved ? 'approved' : 'rejected',
        }));
        setShowFeedback(null);
      }
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setSaving(null);
    }
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

  const handleDownloadApproved = async () => {
    const approvedPhotos = photos.filter(p => approvalStatus[p.id] === 'approved');
    for (let i = 0; i < approvedPhotos.length; i++) {
      await handleDownload(approvedPhotos[i].processedUrl, `${listing.title}-approved-${i + 1}.jpg`);
    }
  };

  const approvedCount = Object.values(approvalStatus).filter(s => s === 'approved').length;
  const rejectedCount = Object.values(approvalStatus).filter(s => s === 'rejected').length;
  const pendingCount = photos.length - approvedCount - rejectedCount;

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
          <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
          <span className="font-semibold">{listing.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-4 h-4" /> {approvedCount}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <X className="w-4 h-4" /> {rejectedCount}
            </span>
            <span className="text-white/50">{pendingCount} pending</span>
          </div>
          {settings.allow_download && approvedCount > 0 && (
            <button
              onClick={handleDownloadApproved}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg font-medium text-black text-sm"
            >
              <Download className="w-4 h-4" /> Download Approved ({approvedCount})
            </button>
          )}
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

            {approvalStatus[selectedPhoto.id] && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-medium ${
                approvalStatus[selectedPhoto.id] === 'approved' 
                  ? 'bg-emerald-500/90 text-white' 
                  : 'bg-red-500/90 text-white'
              }`}>
                {approvalStatus[selectedPhoto.id] === 'approved' ? '✓ Approved' : '✗ Rejected'}
              </div>
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

          {shareToken && settings.allow_approval !== false && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleApproval(selectedPhoto.id, true)}
                  disabled={saving === selectedPhoto.id}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    approvalStatus[selectedPhoto.id] === 'approved'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50'
                  }`}
                >
                  {saving === selectedPhoto.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Approve
                </button>
                
                <button
                  onClick={() => setShowFeedback(showFeedback === selectedPhoto.id ? null : selectedPhoto.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    approvalStatus[selectedPhoto.id] === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                  }`}
                >
                  <X className="w-5 h-5" />
                  Reject
                </button>

                {settings.allow_download && (
                  <button
                    onClick={() => handleDownload(selectedPhoto.processedUrl, `${listing.title}-${selectedIndex + 1}.jpg`)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all"
                  >
                    <Download className="w-5 h-5" /> Download
                  </button>
                )}
              </div>

              {showFeedback === selectedPhoto.id && (
                <div className="flex items-center gap-2 w-full max-w-lg">
                  <div className="flex-1 relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Add feedback (optional)..."
                      value={feedbackText[selectedPhoto.id] || ''}
                      onChange={(e) => setFeedbackText(prev => ({ ...prev, [selectedPhoto.id]: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500/50 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleApproval(selectedPhoto.id, false)}
                    disabled={saving === selectedPhoto.id}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium"
                  >
                    {saving === selectedPhoto.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Submit
                  </button>
                </div>
              )}
            </div>
          )}

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
                {approvalStatus[photo.id] === 'approved' && (
                  <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
                {approvalStatus[photo.id] === 'rejected' && (
                  <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
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
