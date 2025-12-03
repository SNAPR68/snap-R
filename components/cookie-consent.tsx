'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('snapr-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('snapr-cookie-consent', JSON.stringify({ accepted: true, timestamp: Date.now() }));
    setShow(false);
  };

  const declineAll = () => {
    localStorage.setItem('snapr-cookie-consent', JSON.stringify({ accepted: false, timestamp: Date.now() }));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-2xl mx-auto bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <Cookie className="w-6 h-6 text-[#D4A017] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-white/80 text-sm mb-3">
              We use cookies to enhance your experience. By continuing, you agree to our use of cookies.{' '}
              <Link href="/privacy" className="text-[#D4A017] hover:underline">Learn more</Link>
            </p>
            <div className="flex gap-2">
              <button onClick={declineAll} className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/20 rounded-lg">
                Decline
              </button>
              <button onClick={acceptAll} className="px-4 py-2 text-sm font-medium text-black bg-[#D4A017] rounded-lg hover:opacity-90">
                Accept
              </button>
            </div>
          </div>
          <button onClick={declineAll} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
