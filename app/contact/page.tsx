'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Instagram, Linkedin, Youtube, Check } from 'lucide-react';

const CALENDLY_URL = (process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/rajesh-snap-r/30min') + '?embed_type=Inline&hide_gdpr_banner=1&background_color=0f0f0f&text_color=ffffff&primary_color=d4a017';

function ContactContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const isTeamPlan = plan === 'team';

  return (
    <>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold font-serif tracking-tighter text-on-surface mb-4 text-center">Talk to the SnapR Team</h1>
        <p className="text-on-surface-muted mb-8 text-center">Questions about pricing, partnerships, support, or enterprise use? Send us a message and our team will get back to you as quickly as possible.</p>

        {isTeamPlan && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-on-surface font-medium">Need rollout help for a team or brokerage? We can walk you through onboarding, workflow fit, and account setup.</p>
          </div>
        )}

        <div className="bg-surface-container-low p-8 mb-6">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Schedule a 15-minute call</h2>
          <ul className="space-y-3 mb-6 text-on-surface/80">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>Discuss your team&apos;s volume, workflow, and goals</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>Get pricing tailored to your listing volume</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>Ask about onboarding, SLAs, and enterprise support</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>No commitment required</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface-container-low p-8">
          <div className="w-full" style={{ minHeight: '700px' }}>
            <iframe
              src={CALENDLY_URL}
              width="100%"
              height="700"
              frameBorder="0"
              title="Schedule a call"
              className="rounded-lg"
            />
          </div>
        </div>

        <p className="text-on-surface-muted text-sm mt-6 text-center">
          Prefer email? Reach us at <a href="mailto:team@snap-r.com" className="text-primary hover:underline">team@snap-r.com</a>
        </p>
      </main>
    </>
  );
}

export default function ContactPage() {

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <nav className="bg-surface-container-low/90 backdrop-blur-[12px]">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-xl font-bold text-on-surface">Snap<span className="text-primary">R</span></span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-primary transition-colors text-sm">
          ← Back to Home
        </Link>
      </div>

      <Suspense fallback={
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
          <div className="bg-surface-container-low p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-surface-container-high rounded mb-4"></div>
              <div className="h-4 bg-surface-container-high rounded mb-8"></div>
              <div className="h-[700px] bg-surface-container-low rounded"></div>
            </div>
          </div>
        </main>
      }>
        <ContactContent />
      </Suspense>

      <footer className="py-16 px-6 bg-surface-container-low">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-black text-xl">S</div>
                <span className="text-xl font-bold text-on-surface">Snap<span className="text-primary">R</span></span>
              </div>
              <p className="text-on-surface-muted text-sm leading-relaxed">AI Photo Editing Platform that lets Real Estate Media Creators deliver their best work</p>
            </div>
            <div>
              <h4 className="text-on-surface font-semibold mb-4 uppercase tracking-wide text-[0.6875rem]">Company</h4>
              <ul className="space-y-3 text-on-surface-muted text-sm">
                <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-on-surface font-semibold mb-4 uppercase tracking-wide text-[0.6875rem]">Resources</h4>
              <ul className="space-y-3 text-on-surface-muted text-sm">
                <li><Link href="/academy" className="hover:text-primary transition-colors">SnapR Academy</Link></li>
                <li><Link href="/#features" className="hover:text-primary transition-colors">Product Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-on-surface font-semibold mb-4 uppercase tracking-wide text-[0.6875rem]">Legal</h4>
              <ul className="space-y-3 text-on-surface-muted text-sm">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-on-surface-muted text-sm">© 2026 SnapR. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-on-surface-muted hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-on-surface-muted hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-on-surface-muted hover:text-primary transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
