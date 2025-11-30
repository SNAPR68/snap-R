import Link from 'next/link';

export default function TermsPage() {
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
      <main className="max-w-4xl mx-auto px-6 py-16 prose prose-invert">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-white/60">Last updated: January 2025</p>
        <div className="space-y-8 mt-8 text-white/70">
          <section><h2 className="text-xl font-bold text-white">1. Acceptance</h2><p>By using SnapR, you agree to these terms.</p></section>
          <section><h2 className="text-xl font-bold text-white">2. Services</h2><p>SnapR provides AI-powered photo enhancement for real estate images.</p></section>
          <section><h2 className="text-xl font-bold text-white">3. User Content</h2><p>You retain ownership of images you upload. You grant us license to process them.</p></section>
          <section><h2 className="text-xl font-bold text-white">4. Payment</h2><p>Credits are non-refundable. Subscriptions renew automatically.</p></section>
        </div>
      </main>
    </div>
  );
}
