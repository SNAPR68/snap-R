import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Shooting Interiors</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Prep:</strong> Clear surfaces, remove personal items, open blinds, turn on lights.</p>
          <p><strong className="text-white">Living room:</strong> Shoot from entrance/corner.</p>
          <p><strong className="text-white">Kitchen:</strong> Clear counters, shoot toward focal point.</p>
          <p><strong className="text-white">Bathroom:</strong> Close toilet lid, clear products, shoot from doorway.</p>
        </div>
      </div>
    </div>
  );
}
