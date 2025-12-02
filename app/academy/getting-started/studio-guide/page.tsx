import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/getting-started" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Understanding the Studio</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Canvas:</strong> Photo center stage. Scroll to zoom, drag to pan.</p>
          <p><strong className="text-white">Tools:</strong> Right panel houses all AI enhancements.</p>
          <p><strong className="text-white">Compare:</strong> Hover to reveal a before/after slider.</p>
          <p><strong className="text-white">Actions:</strong> Accept saves, Clear resets.</p>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-emerald-500/30 mt-6">
            <p className="text-emerald-400">✨ Press spacebar to toggle before/after instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
