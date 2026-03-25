import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/enhancing-photos" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-2">HDR Enhancement</h1>
        <p className="text-primary mb-6">1 credit per use</p>
        <div className="space-y-4 text-white/70">
          <p>Balance exposure across the entire image.</p>
          <p><strong className="text-on-surface">Fixes:</strong> Dark shadows, blown-out windows</p>
          <p><strong className="text-on-surface">Best for:</strong> Interiors with bright windows</p>
          <p><strong className="text-on-surface">Tip:</strong> Apply HDR before other tools for best results.</p>
        </div>
      </div>
    </div>
  );
}
