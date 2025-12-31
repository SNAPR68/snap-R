import Link from 'next/link';
import { ArrowLeft, Building2, Zap, Check, Crown, Users } from 'lucide-react';

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/academy" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Academy
        </Link>
      </header>
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Plans & Pricing</h1>
        <p className="text-white/60 mb-8">Understanding SnapR's simple listing-based pricing model.</p>
        
        {/* Key Concept */}
        <div className="bg-gradient-to-r from-[#D4A017]/20 to-transparent border border-[#D4A017]/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#D4A017]" />
            How SnapR Pricing Works
          </h2>
          <p className="text-white/70 mb-4">
            Unlike traditional services that charge per photo or per enhancement, SnapR uses <strong>listing-based pricing</strong>. 
            You pay for the number of listings you can create per month, and all AI enhancements are <span className="text-green-400 font-semibold">completely FREE</span>.
          </p>
          <ul className="space-y-2 text-white/60">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> All 15 AI tools included at no extra cost</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Unlimited photos per listing (up to 200)</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Re-enhance as many times as you want</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Content Studio, Video, Email all included</li>
          </ul>
        </div>

        {/* Plans */}
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Free */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-white/60" />
              <h3 className="text-lg font-bold">Free</h3>
            </div>
            <p className="text-3xl font-bold mb-1">$0</p>
            <p className="text-white/50 text-sm mb-4">forever</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• 3 listings/month</li>
              <li>• All 15 AI tools</li>
              <li>• Content Studio (limited)</li>
              <li>• Watermarked exports</li>
              <li>• 60 sec processing</li>
            </ul>
          </div>
          
          {/* Pro */}
          <div className="bg-[#1A1A1A] border-2 border-[#D4A017] rounded-xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4A017] text-black text-xs font-bold rounded-full">
              Most Popular
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-[#D4A017]" />
              <h3 className="text-lg font-bold">Pro</h3>
            </div>
            <p className="text-3xl font-bold text-[#D4A017] mb-1">$7-9</p>
            <p className="text-white/50 text-sm mb-4">per listing</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• 10-75+ listings/month</li>
              <li>• All 15 AI tools</li>
              <li>• Full Content Studio</li>
              <li>• Clean HD exports</li>
              <li>• 30 sec priority processing</li>
              <li>• WhatsApp alerts</li>
            </ul>
          </div>
          
          {/* Agency */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold">Agency</h3>
            </div>
            <p className="text-3xl font-bold mb-1">$9-11</p>
            <p className="text-white/50 text-sm mb-4">per listing</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Unlimited listings</li>
              <li>• All 15 AI tools</li>
              <li>• 5 team members</li>
              <li>• Clean 4K exports</li>
              <li>• Instant processing</li>
              <li>• White-label option</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>

        {/* What Counts as a Listing */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">What Counts as a Listing?</h2>
          <p className="text-white/60 mb-4">
            A listing is a single property address. Each listing can contain up to 200 photos, and you can:
          </p>
          <ul className="space-y-2 text-white/60">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Upload unlimited photos (up to 200 per listing)</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Enhance each photo with multiple AI tools</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Re-enhance and experiment as many times as you want</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Create content, videos, emails, and property sites</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Share with clients for approval</li>
          </ul>
        </div>

        {/* Related Articles */}
        <h2 className="text-xl font-bold mb-4">Related Articles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/academy/plans-credits/choosing-plan" className="p-4 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-[#D4A017]/50 transition-all">
            <h3 className="font-semibold mb-1">Choosing the Right Plan</h3>
            <p className="text-sm text-white/50">Find the perfect plan for your needs</p>
          </Link>
          <Link href="/academy/plans-credits/billing-faq" className="p-4 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-[#D4A017]/50 transition-all">
            <h3 className="font-semibold mb-1">Billing FAQ</h3>
            <p className="text-sm text-white/50">Common questions about billing</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
