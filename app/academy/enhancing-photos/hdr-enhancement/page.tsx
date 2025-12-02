import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/enhancing-photos" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-2">HDR Enhancement</h1>
        <p className="text-[#D4A017] mb-6">1 credit per use</p>
        <div className="space-y-4 text-white/70">
          <p>Balance exposure across the entire image.</p>
          <p><strong className="text-white">Fixes:</strong> Dark shadows, blown-out windows</p>
          <p><strong className="text-white">Best for:</strong> Interiors with bright windows</p>
          <p><strong className="text-white">Tip:</strong> Apply HDR before other tools for best results.</p>
        </div>
      </div>
    </div>
  );
}
