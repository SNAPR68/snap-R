import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/photography-tips" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Lighting Basics</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Golden hours:</strong> First hour after sunrise & last before sunset.</p>
          <p><strong className="text-white">Overcast days:</strong> Soft, even lighting for exteriors.</p>
          <p><strong className="text-white">Interiors:</strong> Turn on all lights, open blinds.</p>
          <p><strong className="text-white">Flash:</strong> Bounce off ceiling, never direct.</p>
        </div>
      </div>
    </div>
  );
}
