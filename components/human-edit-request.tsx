'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, UserCheck, Clock, Send, CheckCircle } from 'lucide-react';

interface HumanEditRequestProps {
  imageId: string;
  photoUrl: string;
  userId: string;
  onClose: () => void;
}

export function HumanEditRequestModal({ imageId, photoUrl, userId, onClose }: HumanEditRequestProps) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setSubmitting(true);

    const { error } = await supabase.from('human_review_queue').insert({
      image_id: imageId,
      user_id: userId,
      reason: reason.trim(),
      priority: priority,
      status: 'pending',
    });

    setSubmitting(false);

    if (!error) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-md text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-white/60">Our team will review your request and get back to you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4A017]/20 rounded-lg">
              <UserCheck className="w-5 h-5 text-[#D4A017]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Request Human Editor</h2>
              <p className="text-white/50 text-sm">Get professional manual edits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {photoUrl && (
          <div className="mb-4 rounded-lg overflow-hidden bg-black/30">
            <img src={photoUrl} alt="Photo to edit" className="w-full h-40 object-cover" />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-white/70 text-sm mb-2">Describe the changes you need</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Remove the car from the driveway, fix the lighting in the kitchen, add more vibrant sky..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#D4A017] outline-none text-white resize-none h-28"
          />
        </div>

        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">Priority</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                priority === 'normal'
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              Normal (24h)
            </button>
            <button
              type="button"
              onClick={() => setPriority('urgent')}
              className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                priority === 'urgent'
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              <Send className="w-4 h-4" />
              Urgent (4h) +$10
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Human Edit Service</span>
            <span className="text-white">$5.00</span>
          </div>
          {priority === 'urgent' && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-white/60">Urgent Processing</span>
              <span className="text-orange-400">+$10.00</span>
            </div>
          )}
          <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-semibold">
            <span className="text-white">Total</span>
            <span className="text-[#D4A017]">${priority === 'urgent' ? '15.00' : '5.00'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-white/20 rounded-xl text-white hover:bg-white/5">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RequestHumanEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:border-[#D4A017]/50 hover:text-[#D4A017] transition-colors"
    >
      <UserCheck className="w-4 h-4" />
      Request Human Edit
    </button>
  );
}
