import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Composition Rules</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Shoot from corners:</strong> Shows depth.</p>
          <p><strong className="text-white">Camera height:</strong> About 4-5 feet feels natural.</p>
          <p><strong className="text-white">Keep verticals straight:</strong> Use grid overlay.</p>
          <p><strong className="text-white">Rule of thirds:</strong> Place key elements on grid lines.</p>
        </div>
      </div>
    </div>
  );
}
