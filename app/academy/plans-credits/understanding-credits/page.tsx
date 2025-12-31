import Link from 'next/link';
import { ArrowLeft, Building2, Zap, Check, Info } from 'lucide-react';

export default function UnderstandingListingsPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/academy/plans-credits" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </Link>
      </header>
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Understanding Listing-Based Pricing</h1>
        <p className="text-white/60 mb-8">How SnapR's simple pricing model works.</p>
        
        {/* Key Point */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-green-400">
            <Zap className="w-5 h-5" />
            AI Enhancements Are FREE
          </h2>
          <p className="text-white/70">
            Unlike competitors who charge $1-4 per enhancement, SnapR includes all 15 AI tools at no extra cost. 
            You only pay for the number of listings you create.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        
        <div className="space-y-6 mb-8">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#D4A017]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#D4A017] font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Create a Listing</h3>
                <p className="text-white/60">Enter a property address to create a new listing. This counts toward your monthly listing limit.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#D4A017]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#D4A017] font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Upload Photos (Up to 200)</h3>
                <p className="text-white/60">Upload as many photos as you need for that property. No per-photo charges.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#D4A017]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#D4A017] font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Enhance Unlimited Times</h3>
                <p className="text-white/60">Use any of the 15 AI tools as many times as you want. Try different effects, re-enhance, experiment — it's all free.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#D4A017]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#D4A017] font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Create Marketing Content</h3>
                <p className="text-white/60">Generate social posts, videos, emails, property sites, and more — all included in your plan.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <h2 className="text-2xl font-bold mb-4">SnapR vs Traditional Services</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h3 className="font-semibold mb-3 text-red-400">Traditional (Fotello, BoxBrownie)</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• $1.60 - $4 per enhancement</li>
              <li>• $12-14 per listing (editing only)</li>
              <li>• 24-48 hour turnaround</li>
              <li>• Separate tools for content</li>
              <li>• No video, no social publishing</li>
            </ul>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h3 className="font-semibold mb-3 text-green-400">SnapR</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• $0 per enhancement (FREE)</li>
              <li>• $7-9 per listing (EVERYTHING)</li>
              <li>• 30-60 second turnaround</li>
              <li>• All-in-one platform</li>
              <li>• Video, content, social included</li>
            </ul>
          </div>
        </div>

        {/* Monthly Reset */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Monthly Reset
          </h2>
          <p className="text-white/60">
            Your listing count resets on the first of each month. Unused listings don't roll over, 
            but all your existing listings and content remain accessible forever.
          </p>
        </div>
      </main>
    </div>
  );
}
