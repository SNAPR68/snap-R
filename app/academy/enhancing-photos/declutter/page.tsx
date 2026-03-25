import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mxauto px-6 py-12">
        <Link href="/academy/enhancing-photos" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-2">Declutter</h1>
        <p className="text-primary mb-6">2 credits per use</p>
        <div className="space-y-4 text-white/70">
          <p>Remove unwanted items from photos.</p>
          <p><strong className="text-on-surface">Targets:</strong> Personal items, extra furniture, trash cans, pet gear</p>
          <p><strong className="text-on-surface">How:</strong> Draw over items, click Process</p>
          <p><strong className="text-on-surface">Tip:</strong> Draw slightly larger than the object for clean fill-in.</p>
        </div>
      </div>
    </div>
  );
}
