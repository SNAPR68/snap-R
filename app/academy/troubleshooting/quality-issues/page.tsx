import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/troubleshooting" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Quality Issues</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Sky looks fake:</strong> Match sky lighting to photo.</p>
          <p><strong className="text-white">Edge artifacts:</strong> Choose sky with similar brightness.</p>
          <p><strong className="text-white">Staging off:</strong> Use empty rooms, good lighting.</p>
          <p><strong className="text-white">Best results:</strong> Start with well-lit, high-res images.</p>
        </div>
      </div>
    </div>
  );
}
