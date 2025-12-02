import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/plans-credits" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Understanding Credits</h1>
        <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10 mb-6">
          <div className="space-y-2 text-white/70">
            <div className="flex justify-between"><span>Sky, HDR, Lawn, Auto-Enhance</span><span className="text-[#D4A017]">1 credit</span></div>
            <div className="flex justify-between"><span>Virtual Twilight, Declutter</span><span className="text-[#D4A017]">2 credits</span></div>
            <div className="flex justify-between"><span>Virtual Staging</span><span className="text-[#D4A017]">3 credits</span></div>
          </div>
        </div>
        <p className="text-white/70"><strong className="text-white">Important:</strong> Credits only deduct when you Accept. Preview/Clear are free. Unused credits roll over monthly.</p>
      </div>
    </div>
  );
}
