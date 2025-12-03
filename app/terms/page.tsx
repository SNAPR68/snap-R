import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-[#D4A017]" />
          <h1 className="text-4xl font-bold">Terms of Service</h1>
        </div>
        
        <p className="text-white/60 mb-8">Last updated: December 3, 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Agreement */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">1. Agreement to Terms</h2>
            <p className="text-white/80 leading-relaxed">
              By accessing or using SnapR's AI-powered real estate photo enhancement platform ("Service") at snap-r.com, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
            <p className="text-white/80 leading-relaxed mt-4">
              We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Description */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">2. Description of Service</h2>
            <p className="text-white/80 leading-relaxed">
              SnapR provides AI-powered photo enhancement tools for real estate photography, including but not limited to: sky replacement, virtual twilight, lawn repair, decluttering, virtual staging, HDR enhancement, and image upscaling.
            </p>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old to use the Service</li>
              <li>One person or entity may not maintain more than one account</li>
              <li>You are responsible for all activities that occur under your account</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">4. Acceptable Use</h2>
            <p className="text-white/80 mb-4">You agree NOT to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Upload content that is illegal, harmful, threatening, abusive, or objectionable</li>
              <li>Upload content that infringes on intellectual property rights of others</li>
              <li>Upload photos containing personally identifiable information of individuals without consent</li>
              <li>Misrepresent properties in a fraudulent manner</li>
              <li>Attempt to reverse engineer, decompile, or extract our AI models</li>
              <li>Use automated systems to access the Service in a manner that exceeds reasonable use</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
            </ul>
          </section>

          {/* Content Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">5. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mt-6 mb-3">5.1 Your Content</h3>
            <p className="text-white/80">
              You retain all ownership rights to the photos you upload ("Your Content"). By uploading content, you grant SnapR a limited license to process, enhance, store, and display Your Content solely for the purpose of providing the Service to you.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.2 Enhanced Content</h3>
            <p className="text-white/80">
              You own the enhanced images created using our Service. You may use, distribute, and commercially exploit enhanced images without restriction, subject to any third-party rights in the original content.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.3 Our Intellectual Property</h3>
            <p className="text-white/80">
              The Service, including its AI models, algorithms, software, design, and documentation, is owned by SnapR and protected by intellectual property laws. You may not copy, modify, or create derivative works of our Service.
            </p>

            <h3 className="text-xl font-medium mt-6 mb-3">5.4 AI Training</h3>
            <p className="text-white/80 p-4 bg-white/5 rounded-lg">
              <strong>We do NOT use your photos to train our AI models.</strong> Your images are processed and stored temporarily to provide the Service, then deleted according to our retention policy.
            </p>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">6. Payment Terms</h2>
            
            <h3 className="text-xl font-medium mt-6 mb-3">6.1 Subscription Plans</h3>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Paid subscriptions are billed monthly or annually in advance</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>No refunds for partial billing periods unless required by law</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">6.2 Credits</h3>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Credits are consumed when using enhancement tools</li>
              <li>Unused credits do not roll over to the next billing period (for subscription plans)</li>
              <li>Credits have no cash value and are non-transferable</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">6.3 Human Editing Service</h3>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Human editing is a one-time service charged per request</li>
              <li>Standard delivery: 24 hours; Urgent delivery: 4 hours</li>
              <li>Refunds available if we fail to deliver within the specified timeframe</li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">7. Disclaimers</h2>
            <div className="p-4 bg-white/5 rounded-lg text-white/80">
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="mb-4">
                WE DO NOT WARRANT THAT:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Service will meet your specific requirements</li>
                <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                <li>The results from using the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">8. Limitation of Liability</h2>
            <div className="p-4 bg-white/5 rounded-lg text-white/80">
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SNAPR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </p>
              <p>
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">9. Indemnification</h2>
            <p className="text-white/80">
              You agree to indemnify and hold harmless SnapR and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses arising from: (a) your use of the Service, (b) your violation of these Terms, (c) your violation of any rights of another party, or (d) Your Content.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">10. Termination</h2>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>You may terminate your account at any time through account settings or by contacting support</li>
              <li>We may suspend or terminate your account for violation of these Terms</li>
              <li>Upon termination, your right to use the Service ceases immediately</li>
              <li>We will delete your data according to our Privacy Policy</li>
              <li>Provisions that by their nature should survive termination shall survive</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">11. Governing Law</h2>
            <p className="text-white/80">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Delaware.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">12. Dispute Resolution</h2>
            <p className="text-white/80 mb-4">
              Before filing a claim, you agree to try to resolve the dispute informally by contacting us at legal@snap-r.com. If the dispute is not resolved within 30 days, either party may proceed with formal dispute resolution.
            </p>
            <p className="text-white/80">
              <strong>Arbitration:</strong> Any disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that you may assert claims in small claims court if eligible.
            </p>
          </section>

          {/* Miscellaneous */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">13. Miscellaneous</h2>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and SnapR</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
              <li><strong>Waiver:</strong> Failure to enforce any right does not waive that right</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms without our consent</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-[#D4A017] mb-4">14. Contact Us</h2>
            <p className="text-white/80 mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-white/5 p-6 rounded-lg">
              <p className="text-white/80"><strong>SnapR</strong></p>
              <p className="text-white/80">Email: <a href="mailto:legal@snap-r.com" className="text-[#D4A017]">legal@snap-r.com</a></p>
              <p className="text-white/80">Support: <a href="mailto:support@snap-r.com" className="text-[#D4A017]">support@snap-r.com</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-white/50 text-sm">
          © 2025 SnapR. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
