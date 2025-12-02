import { Share2, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
export default function DeliveringClientsPage() {
  const articles = [
    { title: 'Sharing Galleries', description: 'Share photos with clients.', readTime: '1 min', slug: 'sharing-galleries' },
    { title: 'Client Approvals', description: 'Get feedback and approvals.', readTime: '1 min', slug: 'client-approvals' },
  ];
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="bg-gradient-to-b from-blue-500/20 to-transparent py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/academy" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to Academy</Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"><Share2 className="w-7 h-7 text-white" /></div>
            <div><h1 className="text-3xl font-bold">Delivering to Clients</h1><p className="text-white/60">Share and get approvals</p></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {articles.map((article, i) => (
            <Link key={i} href={`/academy/delivering-clients/${article.slug}`} className="block bg-[#1A1A1A] rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div><h3 className="text-lg font-semibold mb-1 group-hover:text-blue-400">{article.title}</h3><p className="text-white/60 text-sm">{article.description}</p></div>
                <div className="flex items-center gap-1 text-white/40 text-sm"><Clock className="w-4 h-4" />{article.readTime}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
