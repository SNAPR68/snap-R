import Link from "next/link";
import { AnimatedBackground } from "@/components/animated-background";
import { Camera, Sparkles, ArrowRight, ChevronDown, Clock, Zap, DollarSign } from "lucide-react";
import { headers } from "next/headers";

export default async function Home() {
  // Check if user is logged in
  const headersList = await headers();
  const cookie = headersList.get('cookie') || '';
  const isLoggedIn = cookie.includes('sb-') && cookie.includes('auth-token');

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <AnimatedBackground />
        
        {/* Content overlay */}
        <div className="relative z-10 text-center max-w-4xl mx-auto pt-16 sm:pt-20">
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 leading-tight">
            <span className="text-white">Real Estate</span>
            <br />
            <span className="bg-gradient-to-r from-[#D4A017] via-[#FFD700] to-[#D4A017] bg-clip-text text-transparent">
              Photo Enhancement
            </span>
          </h1>
          
          {/* Tagline - Larger, brighter */}
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2 tracking-wide">
            Upload Raw. <span className="text-[#D4A017]">SnapR</span> It. Download Gold.
          </p>
          
          {/* Supporting line - Smaller than tagline */}
          <p className="text-base sm:text-lg text-white/70 mb-8">
            Stunning photos sell faster.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {/* Primary CTA - Snap Enhance (Most prominent) */}
            <Link
              href={isLoggedIn ? "/dashboard" : "/signup"}
              className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-full hover:shadow-lg hover:shadow-[#D4A017]/30 transition-all duration-300 hover:scale-105"
            >
              <Camera className="w-6 h-6" />
              <span>Snap Enhance</span>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="#mobile-section"
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#D4A017]/50 text-[#D4A017] font-semibold rounded-full hover:bg-[#D4A017]/10 transition-all duration-300"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A017]" />
              <span>30 Second Turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4A017]" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D4A017]" />
              <span>10 Free Credits</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-[#D4A017]/50" />
        </div>
      </section>

      {/* Mobile Section - How It Works */}
      <section id="mobile-section" className="py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#111111]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How <span className="text-[#D4A017]">SnapR</span> Works
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Professional real estate photo enhancement in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4A017]/20 hover:border-[#D4A017]/40 transition-colors">
              <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black">
                1
              </div>
              <div className="mt-4">
                <div className="w-16 h-16 rounded-xl bg-[#D4A017]/10 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-[#D4A017]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Snap or Upload</h3>
                <p className="text-white/60">
                  Take a photo with your phone or upload from your camera roll. Works with any property photo.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4A017]/20 hover:border-[#D4A017]/40 transition-colors">
              <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black">
                2
              </div>
              <div className="mt-4">
                <div className="w-16 h-16 rounded-xl bg-[#D4A017]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-[#D4A017]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Enhancement</h3>
                <p className="text-white/60">
                  Select from Sky Replacement, Virtual Twilight, HDR, Declutter, Lawn Repair, and more.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4A017]/20 hover:border-[#D4A017]/40 transition-colors">
              <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black">
                3
              </div>
              <div className="mt-4">
                <div className="w-16 h-16 rounded-xl bg-[#D4A017]/10 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-[#D4A017]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Download Gold</h3>
                <p className="text-white/60">
                  Get your enhanced photo in 30-60 seconds. Share directly to MLS or download in high resolution.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="text-center mt-12">
            <Link
              href={isLoggedIn ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-lg rounded-full hover:shadow-lg hover:shadow-[#D4A017]/30 transition-all duration-300 hover:scale-105"
            >
              <Camera className="w-6 h-6" />
              <span>Try It Free - 10 Credits</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Transformation Examples */}
      <section id="transformations" className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            See The <span className="text-[#D4A017]">Transformation</span>
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Real results from our AI enhancement tools
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Sky Replacement", desc: "Dull sky → Dramatic sunset" },
              { title: "Virtual Twilight", desc: "Daytime → Golden hour magic" },
              { title: "Lawn Repair", desc: "Brown patches → Lush green" },
              { title: "Declutter", desc: "Remove unwanted items instantly" },
              { title: "HDR Enhancement", desc: "Balance exposure perfectly" },
              { title: "Virtual Staging", desc: "Empty rooms → Furnished spaces" },
            ].map((item, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4A017]/10 hover:border-[#D4A017]/30 transition-all duration-300"
              >
                <div className="h-40 rounded-xl bg-[#0a0a0a] mb-4 flex items-center justify-center border border-[#D4A017]/10 group-hover:border-[#D4A017]/20 transition-colors">
                  <Sparkles className="w-12 h-12 text-[#D4A017]/30 group-hover:text-[#D4A017]/50 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, <span className="text-[#D4A017]">Affordable</span> Pricing
          </h2>
          <p className="text-white/60 mb-8">
            Pay only for what you use. No subscriptions, no hidden fees.
          </p>
          
          <div className="inline-flex flex-col sm:flex-row gap-4 p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4A017]/20">
            <div className="text-left">
              <p className="text-[#D4A017] font-semibold mb-1">Start Free</p>
              <p className="text-3xl font-bold">10 Credits</p>
              <p className="text-white/50 text-sm">No credit card required</p>
            </div>
            <div className="hidden sm:block w-px bg-[#D4A017]/20" />
            <div className="text-left">
              <p className="text-[#D4A017] font-semibold mb-1">Then</p>
              <p className="text-3xl font-bold">$0.50/credit</p>
              <p className="text-white/50 text-sm">Volume discounts available</p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/pricing"
              className="text-[#D4A017] hover:text-[#FFD700] font-semibold transition-colors"
            >
              View Full Pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to <span className="text-[#D4A017]">Transform</span> Your Listings?
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Join thousands of real estate professionals who trust SnapR for stunning property photos.
          </p>
          
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-bold text-xl rounded-full hover:shadow-xl hover:shadow-[#D4A017]/30 transition-all duration-300 hover:scale-105"
          >
            <Camera className="w-7 h-7" />
            <span>Snap Enhance Now</span>
            <Sparkles className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/snapr-logo.png" alt="SnapR" className="w-10 h-10" />
              <span className="text-xl font-bold text-[#D4A017]">SnapR</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-white/50">
              <Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link>
              <Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link>
              <Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms</Link>
              <Link href="/academy" className="hover:text-[#D4A017] transition-colors">Academy</Link>
            </div>
            
            <p className="text-white/30 text-sm">
              © 2024 SnapR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}