import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/enhancing-photos" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-2">Auto-Enhance</h1>
        <p className="text-primary mb-6">1 credit per use</p>
        <div className="space-y-4 text-white/70">
          <p>One-click improvement for color, contrast, and sharpness.</p>
          <p><strong className="text-on-surface">Adjusts:</strong> Color balance, contrast, saturation, sharpness, brightness</p>
          <p><strong className="text-on-surface">Best for:</strong> Quick polish on any photo</p>
          <p><strong className="text-on-surface">Tip:</strong> Great as a final step after other enhancements.</p>
        </div>
      </div>
    </div>
  );
}
