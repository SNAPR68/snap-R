'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Check, X, ChevronLeft, ChevronRight, MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react';
import { trackEvent, SnapREvents } from '@/lib/analytics';

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
  const [clientName, setClientName] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const selectedPhoto = photos[selectedIndex];

  useEffect(() => {
    const initialStatus: Record<string, 'approved' | 'rejected' | null> = {};
    const initialFeedback: Record<string, string> = {};
    photos.forEach(photo => {
      if (photo.clientApproved === true) initialStatus[photo.id] = 'approved';
      else if (photo.clientApproved === false) initialStatus[photo.id] = 'rejected';
      else initialStatus[photo.id] = null;
      initialFeedback[photo.id] = photo.clientFeedback || '';
    });
    setApprovalStatus(initialStatus);
    setFeedbackText(initialFeedback);
  }, [photos]);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSliderPosition(Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100));
  };

  const handleApproval = async (photoId: string, approved: boolean) => {
    console.log("handleApproval called:", { photoId, approved, shareToken });
    // Allow approval with or without shareToken
    setSaving(photoId);
    try {
      const response = await fetch('/api/approve-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, shareToken, approved, feedback: feedbackText[photoId] || null }),
      });
      if (response.ok) {
        setApprovalStatus(prev => ({ ...prev, [photoId]: approved ? 'approved' : 'rejected' }));
        if (approved) {
          trackEvent(SnapREvents.CLIENT_APPROVED_PHOTO);
        } else {
          trackEvent(SnapREvents.CLIENT_REJECTED_PHOTO);
        }
        setShowFeedback(null);
      }
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleSubmitReview = async () => {
    // Allow approval with or without shareToken
    setSubmitting(true);
    try {
      await fetch('/api/notify-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken, clientName: clientName || 'Client' }),
      });
      setSubmitted(true);
      setShowSubmitModal(false);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
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
  const reviewComplete = pendingCount === 0;

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <p>No enhanced photos available yet.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Review Submitted!</h1>
          <p className="text-white/60 mb-6">Thank you for reviewing the photos. The photographer has been notified.</p>
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{approvedCount}</div>
                <div className="text-sm text-white/50">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
                <div className="text-sm text-white/50">Rejected</div>
              </div>
            </div>
          </div>
          {settings.allow_download && approvedCount > 0 && (
            <button onClick={handleDownloadApproved} className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-medium text-black">
              <Download className="w-5 h-5" /> Download Approved Photos
            </button>
          )}
        </div>
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
            <span className="flex items-center gap-1 text-emerald-400"><Check className="w-4 h-4" /> {approvedCount}</span>
            <span className="flex items-center gap-1 text-red-400"><X className="w-4 h-4" /> {rejectedCount}</span>
            <span className="text-white/50">{pendingCount} pending</span>
          </div>
          {shareToken && reviewComplete && (
            <button onClick={() => setShowSubmitModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-lg font-medium text-black text-sm">
              <Send className="w-4 h-4" /> Submit Review
            </button>
          )}
          {settings.allow_download && approvedCount > 0 && (
            <button onClick={handleDownloadApproved} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium text-sm">
              <Download className="w-4 h-4" /> Download ({approvedCount})
            </button>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        <main className="flex-1 p-6 flex flex-col">
          <div className="flex-1 relative bg-[#0A0A0A] rounded-xl overflow-hidden flex items-center justify-center">
            {settings.show_comparison && selectedPhoto.rawUrl ? (
              <div ref={sliderRef} className="relative w-full h-full cursor-col-resize select-none" onMouseMove={handleSliderMove} onTouchMove={handleSliderMove}>
                <img src={selectedPhoto.processedUrl} alt="Enhanced" className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
                <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                  <img src={selectedPhoto.rawUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
                </div>
                <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                  </div>
                </div>
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur rounded-lg text-sm font-medium">Before</div>
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur rounded-lg text-sm font-medium">After</div>
              </div>
            ) : (
              <img src={selectedPhoto.processedUrl} alt="Enhanced" className="w-full h-full object-contain" />
            )}
            {approvalStatus[selectedPhoto.id] && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-medium ${approvalStatus[selectedPhoto.id] === 'approved' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                {approvalStatus[selectedPhoto.id] === 'approved' ? '✓ Approved' : '✗ Rejected'}
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button onClick={() => setSelectedIndex(i => Math.max(0, i - 1))} disabled={selectedIndex === 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full disabled:opacity-30 transition-all"><ChevronLeft className="w-6 h-6" /></button>
                <button onClick={() => setSelectedIndex(i => Math.min(photos.length - 1, i + 1))} disabled={selectedIndex === photos.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full disabled:opacity-30 transition-all"><ChevronRight className="w-6 h-6" /></button>
              </>
            )}
          </div>

          {settings.allow_approval !== false && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="flex items-center gap-3">
                <button onClick={() => handleApproval(selectedPhoto.id, true)} disabled={saving === selectedPhoto.id} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${approvalStatus[selectedPhoto.id] === 'approved' ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50'}`}>
                  {saving === selectedPhoto.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Approve
                </button>
                <button onClick={() => setShowFeedback(showFeedback === selectedPhoto.id ? null : selectedPhoto.id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${approvalStatus[selectedPhoto.id] === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'}`}>
                  <X className="w-5 h-5" /> Reject
                </button>
                {settings.allow_download && (
                  <button onClick={() => handleDownload(selectedPhoto.processedUrl, `${listing.title}-${selectedIndex + 1}.jpg`)} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all">
                    <Download className="w-5 h-5" /> Download
                  </button>
                )}
              </div>
              {showFeedback === selectedPhoto.id && (
                <div className="flex items-center gap-2 w-full max-w-lg">
                  <div className="flex-1 relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input type="text" placeholder="Add feedback (optional)..." value={feedbackText[selectedPhoto.id] || ''} onChange={(e) => setFeedbackText(prev => ({ ...prev, [selectedPhoto.id]: e.target.value }))} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-red-500/50 focus:outline-none" />
                  </div>
                  <button onClick={() => handleApproval(selectedPhoto.id, false)} disabled={saving === selectedPhoto.id} className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium">
                    {saving === selectedPhoto.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Submit
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4 overflow-x-auto py-2 justify-center">
            {photos.map((photo, index) => (
              <button key={photo.id} onClick={() => setSelectedIndex(index)} className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === selectedIndex ? 'border-[#D4A017]' : 'border-transparent hover:border-white/30'}`}>
                <img src={photo.processedUrl} alt="" className="w-full h-full object-cover" />
                {approvalStatus[photo.id] === 'approved' && <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>}
                {approvalStatus[photo.id] === 'rejected' && <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center"><X className="w-6 h-6 text-white" /></div>}
              </button>
            ))}
          </div>
        </main>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Submit Your Review</h2>
            <p className="text-white/60 text-sm mb-6">The photographer will be notified of your selections.</p>
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex justify-center gap-8">
                <div className="text-center"><div className="text-2xl font-bold text-emerald-400">{approvedCount}</div><div className="text-sm text-white/50">Approved</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-red-400">{rejectedCount}</div><div className="text-sm text-white/50">Rejected</div></div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">Your Name (optional)</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#D4A017]/50 focus:outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl hover:bg-white/5">Cancel</button>
              <button onClick={handleSubmitReview} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-semibold text-black flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} {submitting ? 'Sending...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
