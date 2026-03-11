import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Sparkles, Zap, BarChart3, Share2, Globe, Users, Briefcase, ImageIcon } from 'lucide-react';
import { GuideRequestForm } from '@/components/guide-request-form';

export const metadata: Metadata = {
  title: 'Free Real Estate Marketing Guide | SnapR',
  description: 'Download our free guide: AI-powered strategies to market real estate listings faster. 6 chapters of actionable tips for agents and brokers.',
};

const chapters = [
  {
    num: '01',
    title: 'Why Professional Photos Matter',
    desc: 'Industry data on how photo quality impacts sale price, time on market, and buyer engagement.',
    icon: Camera,
  },
  {
    num: '02',
    title: 'The 5-Step Listing Workflow',
    desc: 'The complete pipeline from upload to measurable results: Upload, Prepare, Market, Distribute, Measure.',
    icon: Zap,
  },
  {
    num: '03',
    title: 'AI Photo Enhancement',
    desc: 'Sky replacement, virtual staging, HDR, declutter — how AI transforms ordinary photos in seconds.',
    icon: Sparkles,
  },
  {
    num: '04',
    title: 'Marketing Automation',
    desc: 'Auto-generated descriptions, social captions, MLS packages, property sites, and scheduled posts.',
    icon: Globe,
  },
  {
    num: '05',
    title: 'Social Media & Analytics',
    desc: 'Platform-specific strategies for Instagram, Facebook, LinkedIn, and TikTok with ROI tracking.',
    icon: BarChart3,
  },
  {
    num: '06',
    title: 'Getting Started',
    desc: 'Your first listing live in under 5 minutes. Step-by-step setup guide with pro tips.',
    icon: Share2,
  },
];

const personas = [
  {
    icon: Users,
    title: 'Real Estate Agents',
    desc: 'Save hours on every listing with AI-powered photo enhancement and marketing automation. Focus on clients, not content creation.',
  },
  {
    icon: Briefcase,
    title: 'Brokers & Teams',
    desc: 'Ensure consistent quality across your team. Every agent delivers luxury-level marketing regardless of their tech skills.',
  },
  {
    icon: ImageIcon,
    title: 'Photographers',
    desc: 'Offer AI enhancement as a value-add service. Partner with SnapR to give your clients complete marketing packages.',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] font-['Outfit']">
      {/* Nav */}
      <nav className="border-b border-[#D4A017]/30 bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-white/70 hover:text-white text-sm transition-colors hidden sm:block">Log in</Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 mb-6">
                <span className="text-[#D4A017] text-xs font-semibold tracking-wider uppercase">Free Guide</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                The Real Estate Photo{' '}
                <span className="text-[#D4A017]">Marketing Guide</span>
              </h1>

              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                AI-powered strategies to market your listings faster. 8 pages of actionable tips from upload to analytics, delivered straight to your inbox.
              </p>

              <div className="flex items-center gap-6 text-sm text-white/50 mb-2">
                <span>8 Pages</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>6 Chapters</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span>PDF Format</span>
              </div>
            </div>

            <GuideRequestForm source="guide-page" variant="card" />
          </div>
        </div>
      </section>

      {/* What's Inside */}
      <section className="py-16 px-6 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2 uppercase">What&apos;s Inside</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">6 Chapters of Actionable Strategy</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.num} className="glass-luxury glossy-top p-6 group hover:border-[#D4A017]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D4A017]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#D4A017]" />
                    </div>
                    <span className="text-[#D4A017] text-xs font-semibold tracking-wider">Chapter {ch.num}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{ch.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{ch.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D4A017] text-xs font-semibold tracking-wider mb-2 uppercase">Who This Is For</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Built for Real Estate Professionals</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {personas.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="glass-luxury glossy-top p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#D4A017]/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-[#D4A017]" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 bg-[#0A0A0A]">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Level Up Your Marketing?</h2>
          <p className="text-white/50 text-sm mb-8">
            Join thousands of agents who have downloaded this guide.
          </p>
          <GuideRequestForm source="guide-page" variant="card" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
            <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
            <Link href="/pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link>
          </div>
          <p className="text-white/30 text-xs">&copy; 2026 SnapR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
