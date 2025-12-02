import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/plans-credits" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Choosing a Plan</h1>
        <div className="space-y-4">
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/10"><p className="font-semibold">Starter - $29/mo</p><p className="text-white/60">50 credits • 2-3 listings/month</p></div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#D4A017]/30"><p className="font-semibold text-[#D4A017]">Pro - $79/mo ⭐</p><p className="text-white/60">200 credits • Active agents</p></div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/10"><p className="font-semibold">Brokerage - $199/mo</p><p className="text-white/60">500 credits • Teams/high-volume</p></div>
        </div>
        <p className="text-white/70 mt-6">Average listing uses ~25-40 credits. Start small—you can upgrade anytime.</p>
      </div>
    </div>
  );
}
