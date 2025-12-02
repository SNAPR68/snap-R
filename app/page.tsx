import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Wifi, Shield, Mail, Instagram, Linkedin, Youtube } from 'lucide-react';
import { MobileBadge } from '@/components/mobile-badge';
import { LandingGallery } from '@/components/landing-gallery';
import { Testimonials } from '@/components/testimonials';
import { AnimatedBackground } from '@/components/animated-background';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] font-['Outfit']">
      <AnimatedBackground />
      
      {/* Sharp Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4A017]/30 bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="max-w-full mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <span className="text-2xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          
          {/* Nav Links - Sharp & Visible */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="px-4 py-2 text-white font-medium hover:text-[#D4A017] transition-colors">
              Contact
            </Link>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="px-5 py-2.5 text-white font-medium border border-white/20 rounded-xl hover:border-[#D4A017] hover:text-[#D4A017] transition-all"
            >
              Log in
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-5 py-2.5 font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black rounded-xl hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/academy" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors">
              SnapR Academy
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 5 Free Credits</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> No Credit Card</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 30-Second Results</span>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See the Transformation</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Professional-grade enhancements powered by AI</p>
          </div>
          <LandingGallery />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-[#1A1A1A]/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose SnapR?</h2>
            <p className="text-white/60">Everything you need to create stunning real estate photos</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: '30-Second Processing', desc: 'Get results instantly, not in 24-48 hours' },
              { icon: Camera, title: 'All AI Tools', desc: 'Sky replacement, twilight, staging & more' },
              { icon: Smartphone, title: 'Mobile Ready', desc: 'Edit on any device, anywhere' },
              { icon: Shield, title: 'Pro Quality', desc: 'Results that rival professional editors' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-[#1A1A1A] rounded-2xl border border-white/10 hover:border-[#D4A017]/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#D4A017]/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#D4A017]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/60">Start free, upgrade when you need more</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Free', price: '$0', credits: '10 credits', features: ['7-day trial', 'All AI tools', 'Watermarked exports'] },
              { name: 'Starter', price: '$29/mo', credits: '50 credits', features: ['All AI tools', 'Instant delivery', 'Email support'] },
              { name: 'Pro', price: '$79/mo', credits: '200 credits', features: ['All AI tools', 'Instant delivery', 'Priority support', 'Team sharing'], popular: true },
              { name: 'Enterprise', price: '$199/mo', credits: '500 credits', features: ['All AI tools', 'Instant delivery', 'Dedicated support', 'API access'] },
            ].map((plan, i) => (
              <div key={i} className={`relative p-6 rounded-2xl border ${plan.popular ? 'bg-gradient-to-b from-[#D4A017]/10 to-transparent border-[#D4A017]' : 'bg-[#1A1A1A] border-white/10'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#D4A017]">{plan.price}</span>
                </div>
                <p className="text-white/60 mb-4">{plan.credits}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                      <Check className="w-4 h-4 text[#D4A017]" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block text-center py-3 rounded-xl font-semibold ${plan.popular ? 'bg-gradient-to-r from-[#D4A017] to[#B8860B] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Listings?</h2>
          <p className="text-white/60 mb-8">Join thousands of photographers and agents already using SnapR</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
                <span className="text-xl font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">AI Photo Editing Platform that lets Real Estate Media Creators deliver their best work</p>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link></li>
                <li><Link href="/#pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link></li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/academy" className="hover:text-[#D4A017] transition-colors">SnapR Academy</Link></li>
                <li><Link href="/#features" className="hover:text-[#D4A017] transition-colors">Product Features</Link></li>
                <li><Link href="/academy/enhancing-photos" className="hover:text-[#D4A017] transition-colors">AI Image Features</Link></li>
                <li><Link href="/dashboard/how-it-works" className="hover:text-[#D4A017] transition-colors">How SnapR Works</Link></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-white/60 text-sm mb-6">
                <li><Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms of Service</Link></li>
              </ul>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" />support@snap-r.com</li>
              </ul>
            </div>
          </div>
          {/* Bottom Bar */}
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
