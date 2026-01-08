import Link from 'next/link';
import { Instagram, Linkedin, Youtube } from 'lucide-react';

const faqs = [
  { 
    q: 'What is SnapR?', 
    a: 'SnapR is the complete AI Listing OS for real estate. We help you transform property photos, create marketing content, generate videos, build property galleries, manage client approvals, and share to social media — all from one platform.' 
  },
  { 
    q: 'How does the pricing work?', 
    a: 'SnapR uses simple listing-based pricing. You pay per listing, not per photo or enhancement. All 15 AI tools are included FREE with every plan. Free users get 3 listings/month, Pro starts at $7-9/listing, and Agency at $9-11/listing with team features.' 
  },
  { 
    q: 'How does the free plan work?', 
    a: 'Sign up and get 3 free listings per month with access to all 15 AI enhancement tools. No credit card required. The only limitation is watermarked exports.' 
  },
  { 
    q: 'What AI tools are included?', 
    a: 'All plans include: Sky replacement, virtual twilight, lawn repair, declutter, virtual staging, HDR enhancement, perspective correction, color correction, window pull, lens correction, sharpening, noise reduction, pool enhancement, fireplace fire, and auto enhance.' 
  },
  { 
    q: 'How fast are the enhancements?', 
    a: 'Free tier: ~60 seconds. Pro tier: ~30 seconds (priority processing). Agency tier: Instant processing. This compares to 24-48 hours with traditional editing services.' 
  },
  { 
    q: 'What counts as a "listing"?', 
    a: 'A listing is a single property with up to 200 photos. You can upload, enhance, and re-enhance photos as many times as you want within that listing. Creating a new property address counts as a new listing.' 
  },
  { 
    q: 'What else is included besides photo editing?', 
    a: 'SnapR includes: Content Studio (150+ templates), Video Creator with AI voiceovers, Email Marketing (24 templates), Property Landing Pages, FREE Property Galleries, CMA Reports, Client Approval Workflow, and upload to Instagram, Facebook, LinkedIn, TikTok & WhatsApp.' 
  },
  { 
    q: 'How do I share content to Instagram/Facebook?', 
    a: 'Click "Upload to Instagram" or any platform button. On mobile, it opens the app directly with your image and caption ready to post. On desktop, the image downloads and caption copies to your clipboard, then the platform opens — just upload and paste!' 
  },
  { 
    q: 'Is the Property Gallery really free?', 
    a: 'Yes! Every listing gets a FREE shareable Property Gallery page with all your photos, property details, and a contact form. Share the link with clients or embed it on your website.' 
  },
  { 
    q: 'How much does Virtual Renovation cost?', 
    a: 'Virtual Renovation pricing: $15 for flooring changes, $25 for kitchen or bathroom updates, $50 for full room transformations. AI-powered results in under 2 minutes.' 
  },
  { 
    q: 'How much does AI Voiceover cost?', 
    a: '$2 flat rate per voiceover, regardless of length. Choose from multiple voice styles and get professional narration for your property videos instantly.' 
  },
  { 
    q: 'What image formats do you support?', 
    a: 'We support JPEG, PNG, and WebP formats. Maximum file size is 25MB per image.' 
  },
  { 
    q: 'Is there a mobile app?', 
    a: 'Yes! SnapR offers browser-based mobile editing (industry first) that works on any device. Native iOS and Android apps are coming soon — Pro and Agency users get priority access.' 
  },
  { 
    q: 'How do WhatsApp alerts work?', 
    a: 'Connect your WhatsApp to get instant notifications when clients view your shared galleries, approve/reject photos, or leave feedback. Available on Pro and Agency plans.' 
  },
  { 
    q: 'Can I cancel anytime?', 
    a: 'Yes, cancel anytime with no penalties. Monthly plans have no commitment. Annual plans are billed upfront but you can cancel renewal.' 
  },
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
        <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-white/60 mb-12">Everything you need to know about SnapR, the AI Listing OS for real estate.</p>
        
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
              <p className="text-white/60 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-gradient-to-r from-[#D4A017]/20 to-transparent border border-[#D4A017]/30 rounded-xl text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-white/60 mb-4">We're here to help. Reach out to our team.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black font-semibold rounded-xl hover:bg-[#B8860B] transition-all">
            Contact Us
          </Link>
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
              <p className="text-white/60 text-sm leading-relaxed">The AI Listing OS. From photo to posted in under 2 minutes.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/" className="hover:text-[#D4A017] transition-colors">Home</Link></li>
                <li><Link href="/pricing" className="hover:text-[#D4A017] transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-[#D4A017] transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-[#D4A017] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-white/60 text-sm">
                <li><Link href="/terms" className="hover:text-[#D4A017] transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-[#D4A017] transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-white/60 hover:text-[#D4A017] transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-white/60 hover:text-[#D4A017] transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-white/60 hover:text-[#D4A017] transition-colors"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} SnapR. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
