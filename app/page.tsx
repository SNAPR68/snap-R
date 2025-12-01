import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Wifi, Shield } from 'lucide-react';
import { MobileBadge } from '@/components/mobile-badge';
import { LandingGallery } from '@/components/landing-gallery';
import { Testimonials } from '@/components/testimonials';
import { AnimatedBackground } from '@/components/animated-background';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] font-['Outfit']">
      <AnimatedBackground />
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0F0F0F]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold bg-gradient-to-br from-[#D4A017] to-[#B8860B] shadow-lg shadow-[#D4A017]/30">S</div>
            <span className="text-2xl font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-white/70 hover:text-[#D4A017] transition-colors">Features</Link>
            <Link href="#pricing" className="text-white/70 hover:text-[#D4A017] transition-colors">Pricing</Link>
            <Link href="/faq" className="text-white/70 hover:text-[#D4A017] transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-white/70 hover:text-white transition-colors">Log in</Link>
            <Link href="/onboarding" className="btn-gold-glass">Sign Up</Link>
          </div>
        </div>
      </nav>

      <section className="pt-36 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-sm bg-[#D4A017]/10 border border-[#D4A017]/30">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <span className="text-[#D4A017]">AI-Powered Real Estate Photo Enhancement</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
            The <span className="text-gold-gradient">Gold Standard</span> in<br />Real Estate Photography
          </h1>
          
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Transform ordinary listings into luxury showcases in seconds. AI enhancements that sell properties faster.
          </p>

          <div className="flex justify-center mb-8">
            <MobileBadge />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding" className="btn-gold-glass text-lg px-8 py-4">
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="#features" className="btn-dark-glass text-lg px-8 py-4">
              See How It Works
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 mt-8 text-white/40 text-sm">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 5 Free Credits</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> No Credit Card</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 30-Second Results</span>
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <LandingGallery />
      <Testimonials />

      <section id="mobile-section" className="py-24 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-[#D4A017]/10 border border-[#D4A017]/30">
              <Smartphone className="w-4 h-4 text-[#D4A017]" />
              <span className="text-[#D4A017] text-sm font-medium">Industry First</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Snap & Enhance On The Go</h2>
            <p className="text-white/60 max-w-2xl mx-auto">No app download needed. Open SnapR on your phone, snap a photo, and enhance it instantly right from the property.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { step: '1', icon: Camera, title: 'Open on Mobile', desc: 'Visit snapr.ai on your phone browser. Add to home screen for instant access.' },
              { step: '2', icon: Smartphone, title: 'Snap or Upload', desc: 'Take a photo directly or upload from your gallery. Works with any smartphone.' },
              { step: '3', icon: Sparkles, title: 'Enhance & Share', desc: 'Apply AI enhancements and share with clients instantly for approval.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="glass-card p-6 h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 text-[#D4A017] mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Smartphone, title: 'No App Needed', desc: 'Works in browser' },
              { icon: Wifi, title: 'Works Offline', desc: 'Queue for later' },
              { icon: Zap, title: 'Instant Results', desc: '30-second processing' },
              { icon: Shield, title: 'Secure', desc: 'Bank-level encryption' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                <item.icon className="w-6 h-6 text-[#D4A017]" />
                <div>
                  <p className="font-medium text-white text-sm">{item.title}</p>
                  <p className="text-white/40 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/onboarding" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-semibold text-black hover:opacity-90 transition-opacity">
              <Smartphone className="w-5 h-5" />
              Start Using on Mobile
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-white/40 text-sm mt-4">Free to try • No credit card required</p>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">AI-Powered <span className="text-gold-gradient">Enhancements</span></h2>
          <p className="text-white/60 text-center mb-16 max-w-2xl mx-auto">Professional photo editing in seconds, not hours</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🌅', title: 'Sky Replacement', desc: 'Perfect blue skies in one click' },
              { icon: '🌙', title: 'Virtual Twilight', desc: 'Stunning dusk shots instantly' },
              { icon: '🌿', title: 'Lawn Repair', desc: 'Lush green grass every time' },
              { icon: '🧹', title: 'Declutter', desc: 'Remove unwanted objects' },
              { icon: '🛋️', title: 'Virtual Staging', desc: 'Furnish empty rooms with AI' },
              { icon: '✨', title: 'HDR Enhancement', desc: 'Perfect lighting balance' },
              { icon: '📐', title: 'Perspective Fix', desc: 'Straighten vertical lines' },
              { icon: '🔍', title: 'Upscale 2x', desc: 'Crystal clear resolution' },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 hover:border-[#D4A017]/30 transition-all">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">Simple, <span className="text-gold-gradient">Transparent</span> Pricing</h2>
          <p className="text-white/60 text-center mb-16">Pay as you go or save with a subscription</p>
          
          <div className="glass-card-gold p-8 mb-12 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm bg-[#D4A017]/20 text-[#D4A017]">
              <Zap className="w-4 h-4" /> Most Flexible
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pay As You Go</h3>
            <div className="text-5xl font-bold text-gold-gradient mb-4">$1.50<span className="text-xl text-white/50">/image</span></div>
            <p className="text-white/60 mb-6">No subscription required. Pay only for what you download.</p>
            <Link href="/onboarding" className="btn-gold-glass">Get Started Free</Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-white/50 text-sm mb-6">For individual agents</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$29</span><span className="text-white/50">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['50 Credits/month', 'All AI Tools', 'Email Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70"><Check className="w-4 h-4 text-[#D4A017]" /> {item}</li>
                ))}
              </ul>
              <Link href="/onboarding" className="btn-dark-glass w-full justify-center">Get Started</Link>
            </div>
            
            <div className="glass-card-gold p-8 relative border-2 border-[#D4A017]/50">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#FFD700] to-[#B8860B] text-[#0F0F0F]">MOST POPULAR</div>
              <h3 className="text-xl font-bold text-gold-gradient mb-2">Pro Agent</h3>
              <p className="text-white/50 text-sm mb-6">For active agents</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$79</span><span className="text-white/50">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['200 Credits/month', 'All AI Tools', 'Virtual Staging', 'Priority Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70"><Check className="w-4 h-4 text-[#D4A017]" /> {item}</li>
                ))}
              </ul>
              <Link href="/onboarding" className="btn-gold-glass w-full justify-center">Subscribe Now</Link>
            </div>
            
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-white mb-2">Brokerage</h3>
              <p className="text-white/50 text-sm mb-6">For teams & agencies</p>
              <div className="mb-6"><span className="text-4xl font-bold text-white">$199</span><span className="text-white/50">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['500 Credits/month', 'All Pro features', 'API Access', 'Account Manager'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70"><Check className="w-4 h-4 text-[#D4A017]" /> {item}</li>
                ))}
              </ul>
              <Link href="/onboarding" className="btn-dark-glass w-full justify-center">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-sm bg-gradient-to-br from-[#D4A017] to-[#B8860B]">S</div>
                <span className="text-lg font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
              </div>
              <p className="text-white/40 text-sm">AI-powered real estate photo enhancement for professionals.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><Link href="#features" className="hover:text-[#D4A017]">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-[#D4A017]">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-[#D4A017]">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><Link href="/contact" className="hover:text-[#D4A017]">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-[#D4A017]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#D4A017]">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><a href="mailto:support@snapr.ai" className="hover:text-[#D4A017]">support@snapr.ai</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © 2025 SnapR Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
