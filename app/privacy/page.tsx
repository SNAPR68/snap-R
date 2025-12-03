import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="border-b border-white/10 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snapr-logo.png" alt="SnapR" className="w-12 h-12" />
            <span className="font-bold text-xl">Snap<span className="text-[#D4A017]">R</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-[#D4A017]" />
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>
        
        <p className="text-white/60 mb-8">Last updated: December 3, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-white/80">
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">1. Introduction</h2>
            <p>SnapR is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI-powered real estate photo enhancement platform.</p>
            <p className="mt-4">We comply with GDPR for users in the EEA and CCPA for California residents.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">2. Information We Collect</h2>
            <p><strong>Account Information:</strong> Name, email, password when you create an account.</p>
            <p><strong>Payment Information:</strong> Processed securely by Stripe.</p>
            <p><strong>Photos:</strong> Real estate images you upload for enhancement.</p>
            <p><strong>Usage Data:</strong> Pages visited, features used, device information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">3. How We Use Your Information</h2>
            <p>We use information to provide our photo enhancement services, process transactions, send updates, and improve our platform. We do NOT sell your personal information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">4. Data Sharing</h2>
            <p>We share data with service providers: Supabase (database), Stripe (payments), Vercel (hosting), and AI providers for image processing. All providers are GDPR compliant.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">5. Data Retention</h2>
            <p>Account data is retained while active. Photos are stored for 90 days then deleted. Payment records are kept for 7 years for legal compliance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">6. Your Rights</h2>
            <p><strong>All Users:</strong> Access, correct, delete, and export your data.</p>
            <p><strong>GDPR (EEA):</strong> Restriction, objection, portability, withdraw consent.</p>
            <p><strong>CCPA (California):</strong> Know, delete, opt-out of sale (we dont sell data).</p>
            <p className="mt-4">Exercise your rights at <Link href="/dashboard/settings" className="text-[#D4A017]">Account Settings</Link> or email privacy@snap-r.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">7. Cookies</h2>
            <p>We use essential cookies for functionality, analytics cookies for improvement, and preference cookies for settings. Manage preferences via our cookie banner.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">8. Security</h2>
            <p>We use SSL/TLS encryption, secure authentication, regular audits, and PCI DSS compliant payment processing.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">9. Contact Us</h2>
            <p>Email: <a href="mailto:privacy@snap-r.com" className="text-[#D4A017]">privacy@snap-r.com</a></p>
            <p>Support: <a href="mailto:support@snap-r.com" className="text-[#D4A017]">support@snap-r.com</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-white/50 text-sm">
          © 2025 SnapR. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
