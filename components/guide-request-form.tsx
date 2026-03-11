'use client';

import { useState } from 'react';
import { Check, Loader2, BookOpen } from 'lucide-react';
import { trackEvent, SnapREvents } from '@/lib/analytics';

interface GuideRequestFormProps {
  source: 'homepage' | 'guide-page';
  variant?: 'inline' | 'card';
}

export function GuideRequestForm({ source, variant = 'card' }: GuideRequestFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/guide/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, source }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      trackEvent(SnapREvents.GUIDE_REQUESTED, { source });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className={variant === 'card' ? 'glass-luxury glossy-top rounded-2xl p-8 text-center' : 'text-center py-4'}>
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-green-400" />
        </div>
        <p className="text-white font-semibold text-lg mb-1">Check Your Inbox!</p>
        <p className="text-white/60 text-sm">
          Your guide is on its way to <span className="text-white">{email}</span>
        </p>
      </div>
    );
  }

  // Inline variant — horizontal row for footer
  if (variant === 'inline') {
    return (
      <div className="max-w-md mx-auto text-center">
        <p className="text-white/60 text-sm mb-3 flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4 text-[#D4A017]" />
          Get our free Real Estate Marketing Guide
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            aria-label="Email for marketing guide"
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:border-[#D4A017] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Guide'}
          </button>
        </form>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>
    );
  }

  // Card variant — vertical stacked form
  return (
    <div className="glass-luxury glossy-top rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#D4A017]/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#D4A017]" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Free Download</p>
          <p className="text-white/50 text-xs">Sent directly to your inbox</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          aria-label="Your name"
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#D4A017] focus:outline-none transition-colors"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          aria-label="Email address for marketing guide"
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:border-[#D4A017] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Me the Guide'
          )}
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </form>

      <p className="text-white/30 text-xs mt-3 text-center">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  );
}
