import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-white/60">Last updated: January 2025</p>
        <div className="space-y-8 mt-8 text-white/70">
          <section><h2 className="text-xl font-bold text-white">1. Information We Collect</h2><p>We collect information you provide directly: account details, uploaded images, and payment information.</p></section>
          <section><h2 className="text-xl font-bold text-white">2. How We Use Your Information</h2><p>To provide AI photo enhancement services, process payments, and improve our platform.</p></section>
          <section><h2 className="text-xl font-bold text-white">3. Data Security</h2><p>We use industry-standard encryption and security measures to protect your data.</p></section>
          <section><h2 className="text-xl font-bold text-white">4. Contact</h2><p>Questions? Email us at privacy@snapr.ai</p></section>
        </div>
      </main>
    </div>
  );
}
