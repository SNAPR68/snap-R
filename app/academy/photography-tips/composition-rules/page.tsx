import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Composition Rules</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-on-surface">Shoot from corners:</strong> Shows depth.</p>
          <p><strong className="text-on-surface">Camera height:</strong> About 4-5 feet feels natural.</p>
          <p><strong className="text-on-surface">Keep verticals straight:</strong> Use grid overlay.</p>
          <p><strong className="text-on-surface">Rule of thirds:</strong> Place key elements on grid lines.</p>
        </div>
      </div>
    </div>
  );
}
