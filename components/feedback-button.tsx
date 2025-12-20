'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Send, Bug, Lightbulb, HelpCircle } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'question';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, email }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setType('bug');
      }, 2000);
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { id: 'bug', label: 'Report Bug', icon: Bug, color: 'text-red-400' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-400' },
    { id: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-400' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Send Feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-white/60">Your feedback has been received.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Send Feedback</h2>
                <p className="text-white/50 text-sm mb-6">Help us improve SnapR</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {feedbackTypes.map((ft) => (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => setType(ft.id as FeedbackType)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          type === ft.id
                            ? 'border-[#D4A017] bg-[#D4A017]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <ft.icon className={`w-5 h-5 mx-auto mb-1 ${ft.color}`} />
                        <span className="text-xs text-white/70">{ft.label}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50"
                  />

                  <textarea
                    placeholder={
                      type === 'bug' ? "Describe the bug you encountered..." :
                      type === 'feature' ? "Describe the feature you'd like..." :
                      "What's your question?"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

