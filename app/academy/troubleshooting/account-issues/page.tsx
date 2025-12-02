import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/troubleshooting" className="inline-flex items center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Account Issues</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Forgot password:</strong> Use "Forgot Password" link (check spam).</p>
          <p><strong className="text-white">Cannot log in:</strong> Try other emails, check caps lock, use Google sign-in if used.</p>
          <p><strong className="text-white">Account locked:</strong> Wait 30 minutes after 5 failed attempts.</p>
          <p><strong className="text-white">Change email:</strong> Settings → Profile → Change Email.</p>
        </div>
      </div>
    </div>
  );
}
