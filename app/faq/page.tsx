import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';

const faqs = [
  { q: 'What is SnapR?', a: 'SnapR is an AI-powered photo enhancement platform specifically designed for real estate professionals. We help you transform ordinary property photos into stunning, professional-quality images.' },
  { q: 'How does the free trial work?', a: 'Sign up and get 10 free credits to try any of our AI enhancement tools. No credit card required.' },
  { q: 'What AI tools are included?', a: 'Sky replacement, virtual twilight, lawn repair, declutter, virtual staging, HDR enhancement, perspective correction, and 2x upscaling.' },
  { q: 'How fast are the enhancements?', a: 'Most enhancements complete in 30-60 seconds. Complex operations like virtual staging may take up to 2 minutes.' },
  { q: 'Can I use pay-as-you-go without a subscription?', a: 'Yes! Purchase credits anytime at $1.50 per image with no subscription required.' },
  { q: 'What image formats do you support?', a: 'We support JPEG, PNG, and WebP formats. Maximum file size is 25MB.' },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col">
      <nav className="border-b border-white/10 bg-[#0F0F0F]">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <span className="text-xl font-bold text-white">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4A017] transition-colors text-sm">
          ← Back to Home
        </Link>
      </div>
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-12">Frequently Asked Questions</h1>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
              <p className="text-white/60">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-16 px-6 border-t border-white/10 bg-[#0A0A0A]">
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
                <li><Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link></li>
                <li><Link href="/#pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/academy" className="hover:text-[#D4A017] transition-colors">SnapR Academy</Link></li>
                <li><Link href="/#features" className="hover:text-[#D4A017] transition-colors">Product Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2025 SnapR. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4A017] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4A017] transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#D4A017] transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
