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
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="bg-gradient-to-b from-primary/20 to-transparent py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/academy" className="inline-flex items-center gap-2 text-on-surface-muted hover:text-on-surface mb-6"><ArrowLeft className="w-4 h-4" /> Back to Academy</Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center"><Wand2 className="w-7 h-7 text-on-surface" /></div>
            <div><h1 className="text-3xl font-bold">Enhancing Your Photos</h1><p className="text-on-surface-muted">Master all AI enhancement tools</p></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {articles.map((article, i) => (
            <Link key={i} href={`/academy/enhancing-photos/${article.slug}`} className="block bg-surface-container-low rounded-xl p-6 border border-white/10 hover:border-primary/50 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div><h3 className="text-lg font-semibold mb-1 group-hover:text-primary">{article.title}</h3><p className="text-on-surface-muted text-sm">{article.description}</p></div>
                <div className="flex items-center gap-1 text-on-surface-muted text-sm"><Clock className="w-4 h-4" />{article.readTime}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
