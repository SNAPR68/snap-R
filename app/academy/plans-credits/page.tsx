import { CreditCard, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
export default function PlansCreditsPage() {
  const articles = [
    { title: 'Understanding Credits', description: 'How credits work.', readTime: '1 min', slug: 'understanding-credits' },
    { title: 'Choosing a Plan', description: 'Find the right plan.', readTime: '1 min', slug: 'choosing-plan' },
    { title: 'Billing FAQ', description: 'Payment questions answered.', readTime: '1 min', slug: 'billing-faq' },
  ];
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="bg-gradient-to-b from-purple-500/20 to-transparent py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/academy" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to Academy</Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center"><CreditCard className="w-7 h-7 text-white" /></div>
            <div><h1 className="text-3xl font-bold">Plans & Credits</h1><p className="text-white/60">Billing and credit usage</p></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {articles.map((article, i) => (
            <Link key={i} href={`/academy/plans-credits/${article.slug}`} className="block bg-[#1A1A1A] rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div><h3 className="text-lg font-semibold mb-1 group-hover:text-purple-400">{article.title}</h3><p className="text-white/60 text-sm">{article.description}</p></div>
                <div className="flex items-center gap-1 text-white/40 text-sm"><Clock className="w-4 h-4" />{article.readTime}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
