import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Equipment Guide</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-on-surface">Smartphone:</strong> iPhone 14+ or Samsung S22+ works great.</p>
          <p><strong className="text-on-surface">Camera:</strong> Mirrorless/DSLR + wide-angle lens (16-35mm).</p>
          <p><strong className="text-on-surface">Tripod:</strong> Essential for sharp shots.</p>
          <p><strong className="text-on-surface">Budget tip:</strong> Phone + tripod + SnapR beats pricey gear without editing.</p>
        </div>
      </div>
    </div>
  );
}
