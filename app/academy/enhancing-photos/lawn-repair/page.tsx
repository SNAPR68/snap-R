import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/enhancing-photos" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-2">Lawn Repair</h1>
        <p className="text-[#D4A017] mb-6">1 credit per use</p>
        <div className="space-y-4 text-white/70">
          <p>Transform brown, patchy, or dead grass into lush green lawns.</p>
          <p><strong className="text-white">Fixes:</strong> Brown patches, drought stress, sparse coverage</p>
          <p><strong className="text-white">Best for:</strong> Exterior photos with visible lawn areas</p>
          <p><strong className="text-white">Note:</strong> Cannot add grass where none exists.</p>
        </div>
      </div>
    </div>
  );
}
