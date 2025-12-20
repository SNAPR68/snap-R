'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Loader2, Minimize2, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Ansel, your photography assistant. How can I help you today? Ask me about photo enhancement, pricing, features, or tips to make your listings shine."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | 'issue' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMessage }]
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I'm having trouble responding right now. Please try again or contact support@snap-r.com" 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, something went wrong. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackType) return;
    
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType === 'issue' ? 'bug' : feedbackType === 'positive' ? 'positive' : 'negative',
          message: feedbackMessage || `${feedbackType} feedback from Ansel chat`,
          source: 'ansel-chatbot',
          conversation: messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')
        }),
      });
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackMessage('');
        setFeedbackType(null);
      }, 2000);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-[#D4A017] to-[#9A7B0A] text-black pl-2 pr-5 py-2 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,160,23,0.4)]"
        >
          <div className="w-11 h-11 rounded-full bg-black/10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <circle cx="50" cy="32" r="20" fill="black" opacity="0.9"/>
              <path d="M18 92 Q18 65, 50 58 Q82 65, 82 92" fill="black" opacity="0.9"/>
              <circle cx="50" cy="78" r="7" fill="#D4A017"/>
            </svg>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-sm tracking-wide">Ansel</span>
            <span className="text-xs text-black/70">Chat with me</span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4A017] to-[#B8860B] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                  <circle cx="50" cy="32" r="20" fill="black" opacity="0.9"/>
                  <path d="M18 92 Q18 65, 50 58 Q82 65, 82 92" fill="black" opacity="0.9"/>
                  <circle cx="50" cy="78" r="7" fill="#D4A017"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-black">Ansel</h3>
                <p className="text-black/60 text-xs">Your photo assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-black/60 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-blue-500/20' 
                    : 'bg-[#D4A017]/20'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-4 h-4 text-blue-400" />
                    : (
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                        <circle cx="50" cy="32" r="20" fill="#D4A017" opacity="0.9"/>
                        <path d="M18 92 Q18 65, 50 58 Q82 65, 82 92" fill="#D4A017" opacity="0.9"/>
                        <circle cx="50" cy="78" r="6" fill="black" opacity="0.7"/>
                      </svg>
                    )
                  }
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 text-white'
                    : 'bg-white/5 text-white/80'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4A017]/20 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                    <circle cx="50" cy="32" r="20" fill="#D4A017" opacity="0.9"/>
                    <path d="M18 92 Q18 65, 50 58 Q82 65, 82 92" fill="#D4A017" opacity="0.9"/>
                    <circle cx="50" cy="78" r="6" fill="black" opacity="0.7"/>
                  </svg>
                </div>
                <div className="bg-white/5 rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 text-[#D4A017] animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Feedback Bar */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-white/40">
              <span>Helpful?</span>
              <button
                onClick={() => { setFeedbackType('positive'); setShowFeedback(true); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hover:text-green-400"
                title="Yes, helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setFeedbackType('negative'); setShowFeedback(true); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hover:text-red-400"
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => { setFeedbackType('issue'); setShowFeedback(true); }}
              className="flex items-center gap-1 text-white/40 hover:text-[#D4A017] transition-colors"
            >
              <Flag className="w-3 h-3" />
              <span>Report issue</span>
            </button>
          </div>

          {/* Feedback Modal */}
          {showFeedback && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10 rounded-2xl">
              <div className="bg-[#1A1A1A] rounded-xl p-5 w-full max-w-[300px] border border-white/10">
                {feedbackSubmitted ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ThumbsUp className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-white font-medium">Thank you!</p>
                    <p className="text-white/50 text-sm">Your feedback helps Ansel improve.</p>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold text-white mb-1">
                      {feedbackType === 'positive' && '😊 Glad it helped!'}
                      {feedbackType === 'negative' && '😔 Sorry about that'}
                      {feedbackType === 'issue' && '🚨 Report an Issue'}
                    </h4>
                    <p className="text-white/50 text-xs mb-3">
                      {feedbackType === 'issue' 
                        ? 'Describe the problem you encountered'
                        : 'Any additional comments? (optional)'}
                    </p>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder={feedbackType === 'issue' ? "What went wrong?" : "Tell us more..."}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50 resize-none h-20 mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowFeedback(false); setFeedbackType(null); setFeedbackMessage(''); }}
                        className="flex-1 px-3 py-2 text-white/60 hover:text-white text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitFeedback}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-[#D4A017] to-[#9A7B0A] text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Submit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017]/50 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black p-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

