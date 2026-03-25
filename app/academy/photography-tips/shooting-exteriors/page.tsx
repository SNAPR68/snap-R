import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Shooting Exteriors</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-on-surface">Timing:</strong> Match sun direction to home (east = morning, west = afternoon).</p>
          <p><strong className="text-on-surface">Prep:</strong> Move cars, hide trash cans, clear walkways.</p>
          <p><strong className="text-on-surface">Position:</strong> Shoot from across street for full context.</p>
          <p><strong className="text-on-surface">Tip:</strong> Cloudy day? Use SnapR Sky Replacement afterward.</p>
        </div>
      </div>
    </div>
  );
}
