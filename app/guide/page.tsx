import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Sparkles, Zap, BarChart3, Share2, Globe, Users, Briefcase, ImageIcon } from 'lucide-react';
import { GuideRequestForm } from '@/components/guide-request-form';

export const metadata: Metadata = {
  title: 'Free Real Estate Marketing Guide',
  description: 'Download SnapR\'s free real estate marketing guide with practical strategies to improve listing photos, attract more buyers, and market properties faster.',
  alternates: {
    canonical: '/guide',
  },
  openGraph: {
    title: 'Free Real Estate Marketing Guide | SnapR',
    description: 'Download SnapR\'s free real estate marketing guide with practical strategies to improve listing photos, attract more buyers, and market properties faster.',
    url: 'https://snap-r.com/guide',
  },
  twitter: {
    title: 'Free Real Estate Marketing Guide | SnapR',
    description: 'Download SnapR\'s free guide with strategies to improve listing photos, attract more buyers, and market properties faster.',
  },
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
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-surface-container-low/90 backdrop-blur-[12px]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-on-surface">Snap</span>
              <span className="text-primary">R</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-on-surface/60 hover:text-on-surface text-sm transition-colors hidden sm:block">Log in</Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-black font-semibold rounded-lg text-sm hover:shadow-glow-gold transition-all"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px]" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-primary/10 mb-6">
                <span className="text-primary uppercase tracking-wide text-[0.6875rem] font-semibold">Free Guide</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif tracking-tighter text-on-surface mb-4 leading-tight">
                The Real Estate Photo{' '}
                <span className="text-primary">Marketing Guide</span>
              </h1>

              <p className="text-on-surface-muted text-lg mb-8 leading-relaxed">
                Download the free real estate photo marketing guide to learn how better visuals and faster marketing workflows can help your listings stand out.
              </p>

              <div className="flex items-center gap-6 text-sm text-on-surface-muted mb-2">
                <span>8 Pages</span>
                <span className="w-1 h-1 rounded-full bg-on-surface-muted/60" />
                <span>6 Chapters</span>
                <span className="w-1 h-1 rounded-full bg-on-surface-muted/60" />
                <span>PDF Format</span>
              </div>
            </div>

            <GuideRequestForm source="guide-page" variant="card" />
          </div>
        </div>
      </section>

      {/* What's Inside */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary uppercase tracking-wide text-[0.6875rem] font-semibold mb-2">What&apos;s Inside</p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif tracking-tighter text-on-surface">6 Chapters of Actionable Strategy</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.num} className="bg-surface-container-low p-6 group transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-primary uppercase tracking-wide text-[0.6875rem] font-semibold">Chapter {ch.num}</span>
                  </div>
                  <h3 className="text-on-surface font-semibold mb-2">{ch.title}</h3>
                  <p className="text-on-surface-muted text-sm leading-relaxed">{ch.desc}</p>
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
            <p className="text-primary uppercase tracking-wide text-[0.6875rem] font-semibold mb-2">Who This Is For</p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif tracking-tighter text-on-surface">Built for Real Estate Professionals</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {personas.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="bg-surface-container-low p-6 text-center">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-on-surface font-semibold mb-2">{p.title}</h3>
                  <p className="text-on-surface-muted text-sm leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold font-serif tracking-tighter text-on-surface mb-2">Ready to Level Up Your Marketing?</h2>
          <p className="text-on-surface-muted text-sm mb-8">
            Join thousands of agents who have downloaded this guide.
          </p>
          <GuideRequestForm source="guide-page" variant="card" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold">
              <span className="text-on-surface">Snap</span>
              <span className="text-primary">R</span>
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-on-surface-muted">
            <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
            <Link href="/academy" className="hover:text-primary transition-colors">Academy</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <p className="text-on-surface-muted/60 text-xs">&copy; 2026 SnapR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
