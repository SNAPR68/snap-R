'use client';

import { useState } from 'react';
import { Check, X, MessageSquare, Loader2 } from 'lucide-react';

interface ClientApprovalButtonsProps {
  photoId: string;
  shareToken: string;
  initialApproved?: boolean | null;
  initialFeedback?: string | null;
  onUpdate?: (approved: boolean | null) => void;
}

export function ClientApprovalButtons({ 
  photoId, 
  shareToken, 
  initialApproved, 
  initialFeedback,
  onUpdate 
}: ClientApprovalButtonsProps) {
  const [approved, setApproved] = useState<boolean | null>(initialApproved ?? null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [loading, setLoading] = useState(false);

  const handleApproval = async (isApproved: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/approve-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, shareToken, approved: isApproved, feedback: isApproved ? '' : feedback }),
      });
      if (res.ok) {
        setApproved(isApproved);
        onUpdate?.(isApproved);
        if (!isApproved && !feedback) setShowFeedback(true);
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/approve-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, shareToken, approved: false, feedback }),
      });
      setShowFeedback(false);
    } catch (error) {
      console.error('Feedback failed:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="w-5 h-5 animate-spin text-white/50" />
      </div>
    );
  }

  if (approved === true) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-green-500/10 rounded-lg border border-green-500/30">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-400 font-medium">Approved</span>
        </div>
        <button onClick={() => setApproved(null)} className="text-xs text-white/40 hover:text-white/60 underline">Undo</button>
      </div>
    );
  }

  if (approved === false) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-between px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/30 mb-2">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-400 font-medium">Changes Requested</span>
          </div>
          <button onClick={() => setApproved(null)} className="text-xs text-white/40 hover:text-white/60 underline">Undo</button>
        </div>
        {showFeedback ? (
          <div className="space-y-2 px-1">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What changes are needed?"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#D4A017]/50"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={submitFeedback} disabled={!feedback.trim()} className="px-3 py-1.5 bg-[#D4A017] rounded-lg text-xs text-black font-medium disabled:opacity-50">Send Feedback</button>
              <button onClick={() => setShowFeedback(false)} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white/60">Cancel</button>
            </div>
          </div>
        ) : feedback ? (
          <div className="px-3 py-2 bg-white/5 rounded-lg">
            <p className="text-xs text-white/40 mb-1">Your feedback:</p>
            <p className="text-sm text-white/70 italic">"{feedback}"</p>
            <button onClick={() => setShowFeedback(true)} className="text-xs text-[#D4A017] mt-1 hover:underline">Edit</button>
          </div>
        ) : (
          <button onClick={() => setShowFeedback(true)} className="flex items-center gap-1 text-xs text-[#D4A017] hover:underline px-1">
            <MessageSquare className="w-3 h-3" /> Add feedback
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <button
        onClick={() => handleApproval(true)}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition-all"
      >
        <Check className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-400 font-medium">Approve</span>
      </button>
      <button
        onClick={() => handleApproval(false)}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all"
      >
        <X className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-400 font-medium">Request Changes</span>
      </button>
    </div>
  );
}
