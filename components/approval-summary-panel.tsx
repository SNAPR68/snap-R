'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, RefreshCw, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface ApprovalSummaryPanelProps {
  listingId: string;
  onRefresh?: () => void;
}

interface PhotoApproval {
  id: string;
  client_approved: boolean | null;
  client_feedback: string | null;
  approved_at: string | null;
  variant: string;
  processed_url: string;
}

export function ApprovalSummaryPanel({ listingId, onRefresh }: ApprovalSummaryPanelProps) {
  const [summary, setSummary] = useState<{
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    photos: PhotoApproval[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/approval-summary?listingId=${listingId}`);
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load approval summary:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary();
  }, [listingId]);

  if (loading || !summary || summary.total === 0) {
    return null;
  }

  const hasClientActivity = summary.approved > 0 || summary.rejected > 0;
  
  if (!hasClientActivity) {
    return null;
  }

  const percentApproved = Math.round((summary.approved / summary.total) * 100);
  const rejectedPhotos = summary.photos.filter(p => p.client_approved === false);

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">{percentApproved}%</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Client Approval Status</p>
            <p className="text-xs text-white/50">
              {summary.approved} approved • {summary.rejected} need changes • {summary.pending} pending
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); loadSummary(); onRefresh?.(); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/10">
              <div 
                className="bg-green-500 transition-all" 
                style={{ width: `${(summary.approved / summary.total) * 100}%` }} 
              />
              <div 
                className="bg-red-500 transition-all" 
                style={{ width: `${(summary.rejected / summary.total) * 100}%` }} 
              />
              <div 
                className="bg-white/20 transition-all" 
                style={{ width: `${(summary.pending / summary.total) * 100}%` }} 
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/40">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Approved ({summary.approved})</span>
              <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-500" /> Changes ({summary.rejected})</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-white/40" /> Pending ({summary.pending})</span>
            </div>
          </div>

          {/* Feedback from client */}
          {rejectedPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/60 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Client Feedback
              </p>
              {rejectedPhotos.map(photo => (
                <div key={photo.id} className="flex gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-xs text-red-400 font-medium">{photo.variant}</div>
                  {photo.client_feedback && (
                    <p className="text-xs text-white/60 italic">"{photo.client_feedback}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
