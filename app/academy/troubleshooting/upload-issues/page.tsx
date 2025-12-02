import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/troubleshooting" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Upload Issues</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">File too large:</strong> Max 50MB—compress or export smaller.</p>
          <p><strong className="text-white">Wrong format:</strong> Use JPG/PNG/HEIC (convert RAW first).</p>
          <p><strong className="text-white">Stuck at 0%:</strong> Check connection, try another browser, disable VPN.</p>
          <p><strong className="text-white">Repeated failure:</strong> File may be corrupted—re-export.</p>
        </div>
      </div>
    </div>
  );
}
