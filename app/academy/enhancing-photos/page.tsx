import { Wand2, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
export default function EnhancingPhotosPage() {
  const articles = [
    { title: 'Sky Replacement', description: 'Swap dull skies for stunning ones.', readTime: '1 min', slug: 'sky-replacement' },
    { title: 'Virtual Twilight', description: 'Convert day photos to twilight.', readTime: '1 min', slug: 'virtual-twilight' },
    { title: 'Lawn Repair', description: 'Fix brown or patchy grass.', readTime: '1 min', slug: 'lawn-repair' },
    { title: 'Declutter', description: 'Remove unwanted items.', readTime: '1 min', slug: 'declutter' },
    { title: 'Virtual Staging', description: 'Add furniture to empty rooms.', readTime: '1 min', slug: 'virtual-staging' },
    { title: 'HDR Enhancement', description: 'Balance shadows and highlights.', readTime: '1 min', slug: 'hdr-enhancement' },
    { title: 'Auto-Enhance', description: 'One-click color and contrast fix.', readTime: '1 min', slug: 'auto-enhance' },
  ];
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="bg-gradient-to-b from-[#D4A017]/20 to-transparent py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/academy" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to Academy</Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center"><Wand2 className="w-7 h-7 text-white" /></div>
            <div><h1 className="text-3xl font-bold">Enhancing Your Photos</h1><p className="text-white/60">Master all AI enhancement tools</p></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {articles.map((article, i) => (
            <Link key={i} href={`/academy/enhancing-photos/${article.slug}`} className="block bg-[#1A1A1A] rounded-xl p-6 border border-white/10 hover:border-[#D4A017]/50 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div><h3 className="text-lg font-semibold mb-1 group-hover:text-[#D4A017]">{article.title}</h3><p className="text-white/60 text-sm">{article.description}</p></div>
                <div className="flex items-center gap-1 text-white/40 text-sm"><Clock className="w-4 h-4" />{article.readTime}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
