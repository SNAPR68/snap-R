import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/delivering-clients" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Sharing Galleries</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">1.</strong> Open listing and click "Share"</p>
          <p><strong className="text-white">2.</strong> Choose photos and settings (password, downloads, expiration)</p>
          <p><strong className="text-white">3.</strong> Copy link and send</p>
          <p><strong className="text-white">Download options:</strong> Web (MLS) or Print (full-res)</p>
        </div>
      </div>
    </div>
  );
}
