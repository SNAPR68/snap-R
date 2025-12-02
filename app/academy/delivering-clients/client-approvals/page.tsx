import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/delivering-clients" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Client Approvals</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Enable:</strong> Toggle "Request Approval" when sharing</p>
          <p><strong className="text-white">Client view:</strong> Accept / Request Changes buttons</p>
          <p><strong className="text-white">Notifications:</strong> You get alerts for feedback</p>
          <p><strong className="text-white">Revisions:</strong> Edit in Studio, then notify client</p>
        </div>
      </div>
    </div>
  );
}
