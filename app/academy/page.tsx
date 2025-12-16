import { Rocket, Wand2, Share2, Camera, CreditCard, HelpCircle, ArrowLeft, Instagram, Linkedin, Youtube } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AcademyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const categories = [
    { icon: Rocket, title: 'Getting Started with SnapR', description: 'Everything to set you up for success', articles: 3, color: 'from-emerald-500 to-emerald-600', slug: 'getting-started' },
    { icon: Wand2, title: 'Enhancing Your Photos', description: 'Master all AI enhancement tools', articles: 7, color: 'from-[#D4A017] to-[#B8860B]', slug: 'enhancing-photos' },
    { icon: Camera, title: 'Photography Best Practices', description: 'Shooting tips for real estate photography', articles: 5, color: 'from-pink-500 to-pink-600', slug: 'photography-tips' },
    { icon: Share2, title: 'Delivering to Clients', description: 'Share galleries and get approvals', articles: 2, color: 'from-blue-500 to-blue-600', slug: 'delivering-clients' },
    { icon: CreditCard, title: 'Plans & Credits', description: 'Understand billing and credit usage', articles: 3, color: 'from-purple-500 to-purple-600', slug: 'plans-credits' },
    { icon: HelpCircle, title: 'Troubleshooting', description: 'Common issues and solutions', articles: 4, color: 'from-orange-500 to-orange-600', slug: 'troubleshooting' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      <div className="bg-gradient-to-b from-[#D4A017]/20 to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link 
            href={isLoggedIn ? "/dashboard" : "/"} 
            className="inline-flex items-center gap-2 text-white/60 hover:text[#D4A017] mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 
            {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <div>
              <h1 className="text-4xl font-bold">SnapR Academy</h1>
              <p className="text-white/60 text-lg">Learn to transform real estate photos like a pro</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <Link 
              key={index} 
              href={`/academy/${category.slug}`}
              className="bg[#1A1A1A] rounded-xl p-6 border border-white/10 hover:border[#D4A017]/50 transition-all hover:shadow-lg hover:shadow[#D4A017]/10 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#D4A017] transition-colors">{category.title}</h3>
              <p className="text-white/60 mb-4">{category.description}</p>
              <p className="text-white/40 text-sm">{category.articles} articles</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#D4A017]/20 to-transparent rounded-xl p-8 border border-[#D4A017]/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {isLoggedIn ? "Ready to enhance your photos?" : "Ready to get started?"}
              </h2>
              <p className="text-white/60">
                {isLoggedIn 
                  ? "Transform your property photos in under 60 seconds." 
                  : "Start your free trial with 10 credits today."}
              </p>
            </div>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup"}>
              <button className="px-8 py-3 bg-gradient-to-r from[#D4A017] to[#B8860B] rounded-xl text-black font-semibold hover:opacity-90 whitespace-nowrap">
                {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
              </button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-16 px-6 border-t border-white/10 bg[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
                <span className="text-xl font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">AI Photo Editing Platform that lets Real Estate Media Creators deliver their best work</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/" className="hover:text[#D4A017] transition-colors">Home</Link></li>
                <li><Link href="/#pricing" className="hover:text[#D4A017] transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text[#D4A017] transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text[#D4A017] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/academy" className="hover:text[#D4A017] transition-colors">SnapR Academy</Link></li>
                <li><Link href="/#features" className="hover:text[#D4A017] transition-colors">Product Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/privacy" className="hover:text[#D4A017] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text[#D4A017] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2025 SnapR. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text[#D4A017] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text[#D4A017] transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text[#D4A017] transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
