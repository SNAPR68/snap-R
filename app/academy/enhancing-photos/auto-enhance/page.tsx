import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/enhancing-photos" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-2">Auto-Enhance</h1>
        <p className="text-[#D4A017] mb-6">1 credit per use</p>
        <div className="space-y-4 text-white/70">
          <p>One-click improvement for color, contrast, and sharpness.</p>
          <p><strong className="text-white">Adjusts:</strong> Color balance, contrast, saturation, sharpness, brightness</p>
          <p><strong className="text-white">Best for:</strong> Quick polish on any photo</p>
          <p><strong className="text-white">Tip:</strong> Great as a final step after other enhancements.</p>
        </div>
      </div>
    </div>
  );
}
