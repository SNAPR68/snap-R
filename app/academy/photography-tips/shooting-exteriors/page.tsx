import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Shooting Exteriors</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Timing:</strong> Match sun direction to home (east = morning, west = afternoon).</p>
          <p><strong className="text-white">Prep:</strong> Move cars, hide trash cans, clear walkways.</p>
          <p><strong className="text-white">Position:</strong> Shoot from across street for full context.</p>
          <p><strong className="text-white">Tip:</strong> Cloudy day? Use SnapR Sky Replacement afterward.</p>
        </div>
      </div>
    </div>
  );
}
