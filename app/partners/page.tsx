'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, DollarSign, Users, Camera, Gift, TrendingUp, Zap, Mail, BarChart3, ChevronDown, Loader2 } from 'lucide-react';

// FAQ items
const FAQ = [
  {
    q: 'Who can become a SnapR Partner?',
    a: 'Real estate photographers, virtual tour providers, marketing consultants, real estate coaches, and anyone who works with real estate agents or brokerages. If you have connections in real estate, you can earn.',
  },
  {
    q: 'How much can I earn?',
    a: 'You earn 20% recurring commission on every subscription. If you refer an agent on Pro ($369/mo average), you earn ~$74/month. Refer 10 agents and that\'s $740/month passive income. Brokerage referrals ($599+/mo) earn even more.',
  },
  {
    q: 'When do I get paid?',
    a: 'Commissions are paid monthly via PayPal or direct deposit. You earn as long as your referral stays subscribed - it\'s truly recurring income.',
  },
  {
    q: 'How do I track my referrals?',
    a: 'You get a dedicated partner dashboard showing clicks, signups, active subscriptions, and earnings in real-time.',
  },
  {
    q: 'Is there a cost to join?',
    a: 'No. The Partner Program is completely free. No fees, no minimums, no catches.',
  },
  {
    q: 'What marketing materials do you provide?',
    a: 'We provide email templates, social media posts, demo videos, comparison sheets, and a co-branded landing page with your name and logo.',
  },
  {
    q: 'Can I use SnapR for my own clients?',
    a: 'Absolutely! Many photographer partners use SnapR to deliver enhanced photos + marketing templates to their clients. It\'s a great way to increase your deliverable value.',
  },
];

// Earning examples
const EARNINGS = [
  { referrals: 5, plan: 'Pro', avgMonthly: 369, commission: 369, label: 'Side Income' },
  { referrals: 15, plan: 'Pro', avgMonthly: 369, commission: 1107, label: 'Part-Time Income' },
  { referrals: 30, plan: 'Mixed', avgMonthly: 450, commission: 2700, label: 'Full-Time Income' },
];

export default function PartnersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [referralCount, setReferralCount] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    partner_type: '',
    company: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const monthlyCommission = referralCount * 369 * 0.20;
  const yearlyCommission = monthlyCommission * 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(15000),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      setError(message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 bg-surface-container-low/90 backdrop-blur-[12px] z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-black text-lg">
              S
            </div>
            <span className="text-xl font-semibold">Snap<span className="text-primary">R</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-on-surface/60 hover:text-on-surface transition">Pricing</Link>
            <Link href="/auth/login" className="text-on-surface/60 hover:text-on-surface transition">Log in</Link>
            <Link href="/auth/signup" className="bg-primary text-black px-4 py-2 rounded-lg font-medium hover:shadow-glow-gold transition">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-sm uppercase tracking-wide text-[0.6875rem] mb-6">
              <Gift className="w-4 h-4" />
              Partner Program
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tighter mb-6">
              Turn Referrals Into
              <br />
              <span className="text-primary">Recurring Revenue</span>
            </h1>
            <p className="text-xl text-on-surface-muted mb-8 max-w-2xl mx-auto">
              Refer SnapR to agents, teams, and brokerages and earn recurring revenue from a platform built for modern real estate marketing. No caps, no limits.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#apply"
                className="bg-primary text-black px-8 py-4 rounded-lg font-medium hover:shadow-glow-gold transition flex items-center gap-2 text-lg"
              >
                Become a Partner <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="bg-surface-container-high text-on-surface px-8 py-4 rounded-lg font-medium hover:bg-surface-container-high transition text-lg"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* The Pitch - Why Partner */}
        <section className="py-16 px-4 bg-surface-container-low">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold font-serif tracking-tighter text-center mb-4">Why Become a SnapR Partner?</h2>
            <p className="text-on-surface-muted text-center mb-12 max-w-2xl mx-auto">
              Whether you&apos;re a photographer, coach, or consultant - if you know agents, you can earn.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-surface rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">20% Recurring</h3>
                <p className="text-on-surface-muted">
                  Not a one-time bonus. You earn 20% every month, for as long as your referral stays subscribed.
                </p>
              </div>

              <div className="bg-surface rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">No Caps</h3>
                <p className="text-on-surface-muted">
                  Refer 5 clients or 500. There&apos;s no limit on how much you can earn. Top partners make $2,000+/month.
                </p>
              </div>

              <div className="bg-surface rounded-lg p-8 text-center">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Easy to Sell</h3>
                <p className="text-on-surface-muted">
                  SnapR saves agents time and money. Free trial, no credit card. Your referrals convert themselves.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Earnings Calculator */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-serif tracking-tighter text-center mb-4">Calculate Your Earnings</h2>
            <p className="text-on-surface-muted text-center mb-12">See what you could earn as a SnapR Partner</p>

            <div className="bg-surface-container-low rounded-lg p-8 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <span className="text-on-surface-muted">Active referrals:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={referralCount}
                  onChange={(e) => setReferralCount(parseInt(e.target.value))}
                  className="w-48 accent-[#D4A017]"
                />
                <span className="text-4xl font-bold text-primary w-16">{referralCount}</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface rounded-lg p-6 text-center">
                  <p className="text-on-surface-muted text-sm mb-2">Monthly Earnings</p>
                  <p className="text-4xl font-bold text-primary">${monthlyCommission.toFixed(0)}</p>
                  <p className="text-on-surface-muted text-xs mt-2">Based on avg. Pro plan ($369/mo)</p>
                </div>
                <div className="bg-surface rounded-lg p-6 text-center">
                  <p className="text-on-surface-muted text-sm mb-2">Yearly Earnings</p>
                  <p className="text-4xl font-bold text-green-400">${yearlyCommission.toFixed(0)}</p>
                  <p className="text-on-surface-muted text-xs mt-2">Passive income potential</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {EARNINGS.map((tier, idx) => (
                <div key={idx} className="bg-surface-container-low rounded-lg p-6 text-center">
                  <p className="text-primary uppercase tracking-wide text-[0.6875rem] font-medium mb-2">{tier.label}</p>
                  <p className="text-3xl font-bold mb-1">${tier.commission}/mo</p>
                  <p className="text-on-surface-muted text-sm">{tier.referrals} referrals</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 px-4 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-serif tracking-tighter text-center mb-12">How It Works</h2>

            <div className="space-y-6">
              {[
                { step: 1, icon: Users, title: 'Apply to Join', desc: 'Fill out a quick application. We approve most partners within 24 hours.' },
                { step: 2, icon: Mail, title: 'Get Your Link & Materials', desc: 'Receive your unique referral link, email templates, social posts, and co-branded landing page.' },
                { step: 3, icon: Camera, title: 'Share With Your Network', desc: 'Recommend SnapR to agents, teams, and brokerages you work with. They get a free trial.' },
                { step: 4, icon: DollarSign, title: 'Earn 20% Recurring', desc: 'When they subscribe, you earn 20% every month. Track everything in your partner dashboard.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-6 bg-surface rounded-lg p-6">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-on-surface-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who Is This For */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold font-serif tracking-tighter text-center mb-4">Who Is This For?</h2>
            <p className="text-on-surface-muted text-center mb-12">If you work with real estate professionals, you&apos;re a great fit</p>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Camera, title: 'Photographers', desc: 'Deliver enhanced photos + marketing templates. Add value to every shoot.' },
                { icon: Users, title: 'RE Coaches', desc: 'Recommend tools that actually help your students close more deals.' },
                { icon: BarChart3, title: 'Consultants', desc: 'Add SnapR to your tech stack recommendations. Earn on every client.' },
                { icon: Zap, title: 'Virtual Tour Providers', desc: 'Bundle SnapR with your services for a complete listing package.' },
              ].map((item, idx) => (
                <div key={idx} className="bg-surface-container-low rounded-lg p-6 text-center hover:bg-surface-container-high transition">
                  <item.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-on-surface-muted text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16 px-4 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-serif tracking-tighter text-center mb-12">What Partners Get</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Unique referral link with 90-day cookie',
                'Real-time partner dashboard',
                'Co-branded landing page with your logo',
                'Email templates & social media posts',
                'Demo videos & comparison sheets',
                'Priority support channel',
                'Monthly payouts via PayPal or direct deposit',
                'No minimum threshold to get paid',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-surface rounded-lg p-4">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-serif tracking-tighter text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQ.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-low rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-surface-container-high transition"
                  >
                    <span className="font-medium">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 text-on-surface-muted">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apply CTA */}
        <section id="apply" className="py-20 px-4 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold font-serif tracking-tighter mb-4">Ready to Start Earning?</h2>
            <p className="text-xl text-on-surface-muted mb-8">
              Join the SnapR Partner Program today. Free to join, no minimums, 20% recurring.
            </p>

            <div className="bg-surface rounded-lg p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Application Received!</h3>
                  <p className="text-on-surface-muted">
                    We&apos;ll review your application and get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:outline-none focus:border-primary transition"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <select
                    required
                    value={formData.partner_type}
                    onChange={(e) => setFormData({ ...formData, partner_type: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:outline-none focus:border-primary transition text-on-surface"
                  >
                    <option value="" className="bg-surface">What describes you best?</option>
                    <option value="photographer" className="bg-surface">Real Estate Photographer</option>
                    <option value="virtual_tour" className="bg-surface">Virtual Tour Provider</option>
                    <option value="coach" className="bg-surface">Real Estate Coach / Trainer</option>
                    <option value="consultant" className="bg-surface">Marketing Consultant</option>
                    <option value="other" className="bg-surface">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Company / Business Name (optional)"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:outline-none focus:border-primary transition"
                  />
                  <textarea
                    placeholder="Tell us about your network - how many agents/teams do you work with?"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-low rounded-lg focus:outline-none focus:border-primary transition resize-none"
                  />

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-black font-bold rounded-lg hover:shadow-glow-gold transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Apply to Partner Program <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                  <p className="text-on-surface-muted text-sm">
                    We review applications within 24 hours. No fees, no obligations.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-on-surface-muted text-sm">
          © 2026 SnapR. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
