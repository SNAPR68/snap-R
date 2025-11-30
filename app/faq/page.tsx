import Link from 'next/link';

const faqs = [
  { q: 'What is SnapR?', a: 'SnapR is an AI-powered photo enhancement platform specifically designed for real estate professionals. We help you transform ordinary property photos into stunning, professional-quality images.' },
  { q: 'How does the free trial work?', a: 'Sign up and get 5 free credits to try any of our AI enhancement tools. No credit card required.' },
  { q: 'What AI tools are included?', a: 'Sky replacement, virtual twilight, lawn repair, declutter, virtual staging, HDR enhancement, perspective correction, and 2x upscaling.' },
  { q: 'How fast are the enhancements?', a: 'Most enhancements complete in 30-60 seconds. Complex operations like virtual staging may take up to 2 minutes.' },
  { q: 'Can I use pay-as-you-go without a subscription?', a: 'Yes! Purchase credits anytime at $1.50 per image with no subscription required.' },
  { q: 'What image formats do you support?', a: 'We support JPEG, PNG, and WebP formats. Maximum file size is 25MB.' },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <nav className="border-b border-white/10 bg-[#0F0F0F]">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-emerald-400 to-emerald-600">S</div>
            <span className="text-xl font-bold text-white">Snap<span className="text-emerald-400">R</span></span>
          </Link>
        </div>
      </nav>
      
      <main className="max-w-4xl mx-auto px-6 py-16">
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
    </div>
  );
}
