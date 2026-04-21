'use client';

import { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';

interface Props {
  showingId: string;
  contactName: string;
  propertyLabel: string;
  scheduledAt: string;
}

const INTEREST_LABELS = ['', 'Not interested', 'Somewhat interested', 'Interested', 'Very interested', 'Ready to offer!'];
const INTEREST_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-emerald-400'];

export default function ShowingFeedbackForm({ showingId, contactName, propertyLabel, scheduledAt }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comments, setComments] = useState('');
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const displayRating = hovered || rating;
  const showingDate = new Date(scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please select an interest rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/showing/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showingId, interestLevel: rating, comments: comments || undefined, wantsFollowUp }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to submit feedback.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-surface-container-high border border-white/10 rounded-2xl p-10">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Thanks, {contactName.split(' ')[0]}!</h1>
          <p className="text-white/50 text-sm">Your feedback has been sent to the listing agent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-primary font-bold text-xl tracking-tight">SnapR</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">How was the showing?</h1>
        <p className="text-white/50 text-sm">{propertyLabel}</p>
        <p className="text-white/30 text-xs mt-1">{showingDate}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-container-high border border-white/10 rounded-2xl p-6">
        {/* Star Rating */}
        <div className="mb-6">
          <p className="text-sm text-white/60 mb-3 text-center">How interested are you in this property?</p>
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`Rate ${i} out of 5`}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    i <= displayRating ? 'text-primary fill-accent-gold' : 'text-white/20'
                  }`}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className={`text-center text-sm font-medium ${INTEREST_COLORS[displayRating]}`}>
              {INTEREST_LABELS[displayRating]}
            </p>
          )}
        </div>

        {/* Comments */}
        <div className="mb-4">
          <label className="block text-sm text-white/60 mb-1.5" htmlFor="comments">
            Any comments? <span className="text-white/30">(optional)</span>
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What did you like or dislike? Any questions for the agent?"
            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>

        {/* Follow-up */}
        <label className="flex items-center gap-3 cursor-pointer mb-6 group">
          <input
            type="checkbox"
            checked={wantsFollowUp}
            onChange={e => setWantsFollowUp(e.target.checked)}
            className="w-4 h-4 accent-accent-gold"
          />
          <span className="text-sm text-white/60 group-hover:text-white">I&apos;d like the agent to follow up with me</span>
        </label>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full py-3 bg-accent-gold text-black font-semibold rounded-xl hover:bg-accent-gold disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
