import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/getting-started" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Your First Enhancement</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">1.</strong> Open a photo in Studio</p>
          <p><strong className="text-white">2.</strong> Choose an enhancement (try Sky Replacement)</p>
          <p><strong className="text-white">3.</strong> Pick a style preset</p>
          <p><strong className="text-white">4.</strong> Wait 30-60 seconds</p>
          <p><strong className="text-white">5.</strong> Review and Accept to save</p>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#D4A017]/30 mt-6">
            <p className="text-[#D4A017]">💡 Credits only deduct when you Accept. Preview freely.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
