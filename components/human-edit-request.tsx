'use client';

import { useState } from 'react';
import { X, UserCheck, Clock, Send, Loader2 } from 'lucide-react';

interface HumanEditRequestProps {
  listingId: string;
  photoUrl: string;
  onClose: () => void;
  initialInstructions?: string;
}

export function HumanEditRequestModal({ listingId, photoUrl, onClose, initialInstructions = '' }: HumanEditRequestProps) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!instructions.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/stripe/human-edit-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          photoUrl,
          instructions: instructions.trim(),
          isUrgent,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
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
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Remove the car from the driveway, fix the lighting in the kitchen, add more vibrant sky..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#D4A017] outline-none text-white resize-none h-28"
          />
        </div>

        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">Priority</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsUrgent(false)}
              className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                !isUrgent
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]'
                  : 'border-white/10 text-white/60 hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              Normal (24h)
            </button>
            <button
              type="button"
              onClick={() => setIsUrgent(true)}
              className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                isUrgent
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
          {isUrgent && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-white/60">Urgent Processing</span>
              <span className="text-orange-400">+$10.00</span>
            </div>
          )}
          <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-semibold">
            <span className="text-white">Total</span>
            <span className="text-[#D4A017]">${isUrgent ? '15.00' : '5.00'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-white/20 rounded-xl text-white hover:bg-white/5">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!instructions.trim() || loading}
            className="flex-1 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Pay & Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
