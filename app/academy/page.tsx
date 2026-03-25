import { Rocket, Wand2, Share2, Camera, CreditCard, HelpCircle, ArrowLeft, Instagram, Linkedin, Youtube } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SnapR Academy | Real Estate Photo Marketing Guides',
  description: 'Learn real estate photo editing and listing marketing best practices with tutorials, guides, and AI workflow tips from SnapR Academy.',
  alternates: {
    canonical: '/academy',
  },
  openGraph: {
    title: 'SnapR Academy | Real Estate Photo Marketing Guides',
    description: 'Learn real estate photo editing and listing marketing best practices with tutorials, guides, and AI workflow tips from SnapR Academy.',
    url: 'https://snap-r.com/academy',
  },
  twitter: {
    title: 'SnapR Academy | Real Estate Photo Marketing Guides',
    description: 'Learn real estate photo editing and listing marketing best practices with tutorials, guides, and AI workflow tips from SnapR Academy.',
  },
};

export default async function AcademyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const categories = [
    { icon: Rocket, title: 'Getting Started with SnapR', description: 'Everything to set you up for success', articles: 3, color: 'from-emerald-500 to-emerald-600', slug: 'getting-started' },
    { icon: Wand2, title: 'Enhancing Your Photos', description: 'Master all AI enhancement tools', articles: 7, color: 'from-primary to-primary-container', slug: 'enhancing-photos' },
    { icon: Camera, title: 'Photography Best Practices', description: 'Shooting tips for real estate photography', articles: 5, color: 'from-pink-500 to-pink-600', slug: 'photography-tips' },
    { icon: Share2, title: 'Delivering to Clients', description: 'Share galleries and get approvals', articles: 2, color: 'from-blue-500 to-blue-600', slug: 'delivering-clients' },
    { icon: CreditCard, title: 'Plans & Credits', description: 'Understand billing and credit usage', articles: 3, color: 'from-purple-500 to-purple-600', slug: 'plans-credits' },
    { icon: HelpCircle, title: 'Troubleshooting', description: 'Common issues and solutions', articles: 4, color: 'from-orange-500 to-orange-600', slug: 'troubleshooting' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      <div className="bg-gradient-to-b from-primary/20 to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 text-on-surface-muted hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-black text-xl">S</div>
            <div>
              <h1 className="text-4xl font-bold font-serif tracking-tighter">SnapR Academy</h1>
              <p className="text-on-surface-muted text-lg">Learn how to improve listing photos, market properties faster, and use AI tools more effectively with practical guides</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={`/academy/${category.slug}`}
              className="bg-surface-container-low rounded-lg p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-6 h-6 text-on-surface" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{category.title}</h3>
              <p className="text-on-surface-muted mb-4">{category.description}</p>
              <p className="text-on-surface-muted text-sm">{category.articles} articles</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-primary/20 to-transparent rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold font-serif tracking-tighter mb-2">
                {isLoggedIn ? "Ready to enhance your photos?" : "Ready to get started?"}
              </h2>
              <p className="text-on-surface-muted">
                {isLoggedIn
                  ? "Transform your property photos in under 60 seconds."
                  : "Start your free trial with 10 credits today."}
              </p>
            </div>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"}>
              <button className="px-8 py-3 bg-gradient-to-r from-primary to-primary-container rounded-lg text-black font-semibold hover:shadow-glow-gold whitespace-nowrap">
                {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
              </button>
            </Link>
          </div>
        </div>
      </div>

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
