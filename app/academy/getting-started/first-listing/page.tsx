import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/getting-started" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Creating Your First Listing</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-on-surface">1.</strong> Click &quot;New Listing&quot; on your dashboard</p>
          <p><strong className="text-on-surface">2.</strong> Enter the property address and name</p>
          <p><strong className="text-on-surface">3.</strong> Drag & drop photos (JPG, PNG, HEIC up to 50MB)</p>
          <p><strong className="text-on-surface">4.</strong> Click any photo to open the Studio</p>
          <div className="bg-surface-container-low rounded-xl p-4 border border-[#D4A017]/30 mt-6">
            <p className="text-primary">💡 Upload high-resolution photos for best AI results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
