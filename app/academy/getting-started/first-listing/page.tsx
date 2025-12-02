import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/getting-started" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Creating Your First Listing</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">1.</strong> Click "New Listing" on your dashboard</p>
          <p><strong className="text-white">2.</strong> Enter the property address and name</p>
          <p><strong className="text-white">3.</strong> Drag & drop photos (JPG, PNG, HEIC up to 50MB)</p>
          <p><strong className="text-white">4.</strong> Click any photo to open the Studio</p>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-[#D4A017]/30 mt-6">
            <p className="text-[#D4A017]">💡 Upload high-resolution photos for best AI results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
