import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/troubleshooting" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Processing Errors</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-on-surface">Timeout:</strong> Try again—complex images take longer.</p>
          <p><strong className="text-on-surface">Sky not detected:</strong> Need visible sky region.</p>
          <p><strong className="text-on-surface">No credits charged:</strong> Failed enhancements are free.</p>
          <p><strong className="text-on-surface">Tip:</strong> Off-peak hours (early AM/late PM) process faster.</p>
        </div>
      </div>
    </div>
  );
}
