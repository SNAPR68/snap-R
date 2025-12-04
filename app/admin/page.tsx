import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, Smartphone, Camera, Shield, Mail, Instagram, Linkedin, Youtube, Globe, QrCode, Share2 } from 'lucide-react';
import { LandingGallery } from '@/components/landing-gallery';
import { Testimonials } from '@/components/testimonials';
import { AnimatedBackground } from '@/components/animated-background';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] font-['Outfit']">
      <AnimatedBackground />
      
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4A017]/30 bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="max-w-full mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <span className="text-2xl font-bold">
              <span className="text-white">Snap</span>
              <span className="text-[#D4A017]">R</span>
            </span>
          </Link>
          
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
      <section className="pt-36 pb-12 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#D4A017]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#D4A017]/10 rounded-full blur-[80px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-sm bg-[#D4A017]/10 border border-[#D4A017]/30">
            <Sparkles className="w-4 h-4 text-[#D4A017]" />
            <span className="text-[#D4A017]">AI-Powered Real Estate Photo Enhancement</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-10 leading-tight text-white">
            The <span className="text-gold-gradient">Gold Standard</span> in<br />Real Estate Photo Enhancement
          </h1>
          
          {/* Three Impactful Phrases - Larger Width */}
          <div className="flex flex-col items-center gap-2 mb-4 max-w-3xl mx-auto">
            <p className="text-2xl md:text-3xl text-white font-semibold tracking-wide">
              Upload Raw. <span className="text-white font-bold">Snap</span><span className="text-[#D4A017] font-bold">R</span> It.
            </p>
            <p className="text-2xl md:text-3xl text-[#D4A017] font-bold tracking-wide">
              Download Gold.
            </p>
          </div>
          
          {/* Supporting Line - Gold + White */}
          <div className="mb-10">
            <p className="text-xl md:text-2xl">
              <span className="text-[#D4A017] font-semibold">Stunning photos sell faster.</span>
              <span className="text-white font-medium ml-2">It's that simple.</span>
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/academy" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors">
              SnapR Academy
            </Link>
          </div>
          
          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 10 Free Credits</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> No Credit Card</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4A017]" /> 30-Second Results</span>
          </div>
        </div>
      </section>

      {/* How It Works - Browser-Based Mobile Workflow */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-[#0F0F0F] to-[#1A1A1A]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            {/* Industry First Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-[#D4A017]/10 border border-[#D4A017]/30">
              <Smartphone className="w-4 h-4 text-[#D4A017]" />
              <span className="text-[#D4A017] font-semibold text-sm">INDUSTRY FIRST</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Edit Directly From Your <span className="text-[#D4A017]">Phone Browser</span>
            </h2>
            <p className="text-[#D4A017] font-medium max-w-2xl mx-auto text-lg">
              No app to download. No software to install. Just open your phone's browser and start enhancing.
            </p>
          </div>
          
          {/* Browser-Based Explanation */}
          <div className="bg-[#1A1A1A] border border-[#D4A017]/20 rounded-2xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                  <Globe className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Open snap-r.com</h3>
                <p className="text-white/50 text-sm">
                  On your iPhone, Android, or tablet — just open Safari or Chrome and go to <span className="text-[#D4A017]">snap-r.com</span>. Bookmark it for quick access.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                  <Camera className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Snap or Upload</h3>
                <p className="text-white/50 text-sm">
                  Take a photo directly with your phone camera, or upload from your gallery. Create a listing and add all your property photos.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Enhance & Share</h3>
                <p className="text-white/50 text-sm">
                  Select AI tools like sky replacement or virtual twilight. Get results in 30 seconds. Download or share directly to MLS.
                </p>
              </div>
            </div>
            
            {/* Pro Tip */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/40 text-sm">
                <span className="text-[#D4A017] font-medium">Pro Tip:</span> Add SnapR to your home screen for app-like experience — tap the share button and select "Add to Home Screen"
              </p>
            </div>
          </div>
          
          {/* Device Compatibility */}
          <div className="text-center">
            <p className="text-white/40 text-sm">
              Works on iPhone, Android, iPad, Mac, Windows — any device with a modern browser
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section - Single Instance */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See the <span className="text-[#D4A017]">Transformation</span></h2>
            <p className="text-white/60 max-w-2xl mx-auto">Hover over each image to see the before and after. Our AI delivers professional results in seconds.</p>
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

      {/* Pricing Section - Interactive */}
      <PricingSection />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Listings?</h2>
          <p className="text-white/60 mb-8">Join thousands of photographers and agents already using SnapR</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-semibold rounded-xl hover:opacity-90">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Slim Footer */}
      <footer className="py-10 px-6 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
              <div>
                <span className="text-lg font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
                <p className="text-white/40 text-xs">AI Photo Enhancement for Real Estate</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/50">
              <Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link>
              <Link href="#features" className="hover:text-[#D4A017] transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link>
              <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
              <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
              <Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms</Link>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-[#D4A017] hover:bg-[#D4A017]/10 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-[#D4A017] hover:bg-[#D4A017]/10 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-[#D4A017] hover:bg-[#D4A017]/10 transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-xs">© 2025 SnapR. All rights reserved.</p>
            <a href="mailto:support@snap-r.com" className="flex items-center gap-2 text-white/30 text-xs hover:text-[#D4A017] transition-colors">
              <Mail className="w-3 h-3" /> support@snap-r.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}