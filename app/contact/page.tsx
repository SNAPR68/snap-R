import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <nav className="border-b border-white/10 bg-[#0F0F0F]">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapr-logo.png" alt="SnapR" className="w-[76px] h-[76px]" />
            <span className="text-xl font-bold text-white">Snap<span className="text-emerald-400">R</span></span>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4A017] transition-colors text-sm">
          <span>←</span> Back to Home
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-[#D4A017] transition-colors text-sm">
          ← Back to Home
        </Link>
      </div>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
        <p className="text-white/60 mb-12">Have questions? We'd love to hear from you.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Send a Message</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
              <textarea placeholder="Message" rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"></textarea>
              <button className="btn-gold-glass w-full">Send Message</button>
            </form>
          </div>
          
          <div className="space-y-6">
            <div className="glass-card p-6 flex items-start gap-4">
              <Mail className="w-6 h-6 text-emerald-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Email</h3>
                <p className="text-white/60">support@snap-r.com</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-start gap-4">
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
