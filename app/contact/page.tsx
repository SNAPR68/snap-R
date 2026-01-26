'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Instagram, Linkedin, Youtube, Check } from 'lucide-react';

// TODO: Replace with actual Calendly URL
const CALENDLY_URL = 'https://calendly.com/rajesh-snap-r/30min';

function ContactContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const isTeamPlan = plan === 'team';

  return (
    <>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-4 text-center">Let's talk</h1>
        <p className="text-white/60 mb-8 text-center">Book a call to discuss custom pricing for your team.</p>
        
        {isTeamPlan && (
          <div className="mb-6 p-4 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl text-center">
            <p className="text-white font-medium">You selected the Team plan. Let's discuss custom pricing for your brokerage.</p>
          </div>
        )}

        <div className="glass-card p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Schedule a 15-minute call</h2>
          <ul className="space-y-3 mb-6 text-white/80">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
              <span>Discuss your team's volume and needs</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
              <span>Get custom pricing for 30+ listings</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
              <span>Learn about white-label options</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
              <span>No commitment required</span>
            </li>
          </ul>
        </div>

        <div className="glass-card p-8">
          <div className="w-full" style={{ minHeight: '700px' }}>
            <iframe
              src={CALENDLY_URL}
              width="100%"
              height="700"
              frameBorder="0"
              title="Schedule a call"
              className="rounded-xl"
            />
          </div>
        </div>

        <p className="text-white/60 text-sm mt-6 text-center">
          Prefer email? Reach us at <a href="mailto:team@snap-r.com" className="text-[#D4A017] hover:underline">team@snap-r.com</a>
        </p>
      </main>
    </>
  );
}

export default function ContactPage() {

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col">
      <nav className="border-b border-white/10 bg[#0F0F0F]">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <span className="text-xl font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4A017] transition-colors text-sm">
          ← Back to Home
        </Link>
      </div>
      
      <Suspense fallback={
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
          <div className="glass-card p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded mb-4"></div>
              <div className="h-4 bg-white/10 rounded mb-8"></div>
              <div className="h-[700px] bg-white/5 rounded"></div>
            </div>
          </div>
        </main>
      }>
        <ContactContent />
      </Suspense>

      <footer className="py-16 px-6 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
                <span className="text-xl font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">AI Photo Editing Platform that lets Real Estate Media Creators deliver their best work</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link></li>
                <li><Link href="/#pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/academy" className="hover:text-[#D4A017] transition-colors">SnapR Academy</Link></li>
                <li><Link href="/#features" className="hover:text-[#D4A017] transition-colors">Product Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2025 SnapR. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4A017] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4A017] transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4A017] transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
