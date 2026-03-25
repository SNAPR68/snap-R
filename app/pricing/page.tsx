'use client';

import Link from 'next/link';
import PricingSection from '@/components/pricing-section';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 bg-surface-container-low/90 backdrop-blur-[12px] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-xl font-bold">Snap<span className="text-primary">R</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-on-surface-muted hover:text-on-surface">Log in</Link>
            <Link href="/auth/signup" className="px-4 py-2 bg-primary text-black rounded-lg font-medium">Start Free</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <PricingSection showHeadline={true} showFAQ={true} showCTA={true} headingLevel="h1" />
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-black">S</div>
            <span className="font-bold">Snap<span className="text-primary">R</span></span>
          </div>
          <p className="text-on-surface-muted text-sm">&copy; 2026 SnapR. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-on-surface-muted">
            <Link href="/terms" className="hover:text-on-surface">Terms</Link>
            <Link href="/privacy" className="hover:text-on-surface">Privacy</Link>
            <Link href="/contact" className="hover:text-on-surface">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
