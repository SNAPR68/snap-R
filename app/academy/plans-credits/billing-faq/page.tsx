import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function Article() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/academy/plans-credits" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <h1 className="text-3xl font-bold mb-6">Billing FAQ</h1>
        <div className="space-y-4 text-white/70">
          <p><strong className="text-white">Billing date:</strong> Same day each month as signup.</p>
          <p><strong className="text-white">Payments:</strong> Visa, Mastercard, Amex via Stripe.</p>
          <p><strong className="text-white">Refunds:</strong> 7-day money-back on first payment.</p>
          <p><strong className="text-white">Cancel:</strong> Settings → Billing → Cancel (access until period ends).</p>
          <p><strong className="text-white">Annual:</strong> Save 20%—email support@snap-r.com.</p>
        </div>
      </div>
    </div>
  );
}
