import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const billingFaqs = [
  {
    q: 'When does my listing count reset?',
    a: 'Your listing count resets on the first day of each month. For example, if you sign up on January 15th, your listings will reset on February 1st.'
  },
  {
    q: 'Do unused listings roll over?',
    a: 'No, unused listings do not roll over to the next month. However, all your existing listings and their content remain accessible forever.'
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes! You can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.'
  },
  {
    q: 'What happens if I exceed my listing limit?',
    a: 'You won\'t be able to create new listings until the next month or until you upgrade your plan. Existing listings continue to work normally.'
  },
  {
    q: 'Are AI enhancements really free?',
    a: 'Yes! All 15 AI enhancement tools are included at no extra cost with every plan, including the Free tier. You can enhance photos as many times as you want.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment system.'
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time. Monthly plans have no commitment. For annual plans, you can cancel the renewal but the current period remains active.'
  },
  {
    q: 'What\'s the difference between monthly and annual billing?',
    a: 'Annual billing saves you money — you get 1 month free (billed for 11 months instead of 12). Monthly plans offer more flexibility with 1 week free on your first month.'
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 14-day money-back guarantee for Pro and Agency plans. If you\'re not satisfied, contact us within 14 days for a full refund.'
  },
  {
    q: 'How do team seats work on Agency?',
    a: 'Agency plans include 5 team members. Each member gets their own login and can work on shared listings. Additional seats can be added for $20/month each.'
  },
];

export default function BillingFAQPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/academy/plans-credits" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </Link>
      </header>
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Billing FAQ</h1>
        <p className="text-white/60 mb-8">Common questions about billing and subscriptions.</p>
        
        <div className="space-y-4">
          {billingFaqs.map((faq, i) => (
            <div key={i} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-white/60 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-6 bg-[#1A1A1A] border border-white/10 rounded-xl text-center">
          <h3 className="font-semibold mb-2">Still have questions?</h3>
          <p className="text-white/60 text-sm mb-4">Our team is here to help with any billing questions.</p>
          <Link href="/contact" className="text-[#D4A017] hover:underline">Contact Support →</Link>
        </div>
      </main>
    </div>
  );
}
