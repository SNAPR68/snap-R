'use client';

import Link from 'next/link';
import PricingSection from '@/components/pricing-section';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-xl font-bold">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-white/60 hover:text-white">Log in</Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium">Start Free</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <PricingSection showHeadline={true} showFAQ={true} showCTA={true} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black">S</div>
            <span className="font-bold">Snap<span className="text-[#D4A017]">R</span></span>
          </div>
          <p className="text-white/40 text-sm">© 2025 SnapR. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:txt-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
