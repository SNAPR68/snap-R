'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Camera, Home, Building2, Users, Briefcase, Loader2,
  ChevronRight, ChevronLeft, Upload, Sparkles, CheckCircle, Share2,
} from 'lucide-react';

const ROLES = [
  { id: 'photographer', label: 'Real Estate Photographer', icon: Camera, description: 'I shoot properties for clients' },
  { id: 'agent', label: 'Real Estate Agent', icon: Home, description: 'I list and sell properties' },
  { id: 'broker', label: 'Brokerage House', icon: Building2, description: 'I manage multiple agents' },
  { id: 'property-manager', label: 'Property Manager', icon: Users, description: 'I manage rental properties' },
  { id: 'property-owner', label: 'Property Owner', icon: Briefcase, description: 'I own properties to sell/rent' },
];

const TOTAL_STEPS = 3;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // URL params from pricing page / Stripe success
  const roleFromUrl = searchParams.get('role');
  const planFromUrl = searchParams.get('plan');
  const listingsFromUrl = searchParams.get('listings');
  const priceFromUrl = searchParams.get('price');
  const billingFromUrl = searchParams.get('billing');
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Step 1: Profile + Role (merged)
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signup');
        return;
      }
      if (user.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      }

      // Pre-fill role from URL
      if (roleFromUrl) {
        setSelectedRole(roleFromUrl);
      }

      setCheckingAuth(false);
    }
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = async (redirectTo: string = '/listings/new?guided=true') => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Save profile — only essential fields; brand/social/phone collected progressively later
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      company,
      role: selectedRole,
      plan: planFromUrl || 'free',
      listings_limit: listingsFromUrl ? parseInt(listingsFromUrl) : 3,
      price_per_listing: priceFromUrl ? parseFloat(priceFromUrl) : 0,
      billing_cycle: billingFromUrl || 'monthly',
      notification_preferences: {
        email: true,
        whatsapp: false,
        transactional: 'all',
        clientEngagement: 'all',
        dailyWhatsapp: false,
        weeklySummary: true,
      },
      onboarded_at: new Date().toISOString(),
    });

    if (profileError) {
      setLoading(false);
      alert('Failed to save your profile. Please try again.');
      return;
    }

    // Update auth user metadata (non-blocking)
    await supabase.auth.updateUser({
      data: {
        full_name: name,
        role: selectedRole,
        plan: planFromUrl || 'free',
        onboarded: true,
      }
    });

    router.push(redirectTo);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">

          {/* STEP 1: Profile + Role (merged — was steps 1+2) */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-bold text-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] shadow-lg shadow-[#D4A017]/30 mx-auto mb-4">S</div>
                <h1 className="text-3xl font-bold mb-2">Welcome to SnapR</h1>
                <p className="text-white/60">Just two quick things and you&apos;re in</p>
              </div>

              {/* Checkout success banner */}
              {checkoutSuccess && planFromUrl && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-400">Payment confirmed!</p>
                    <p className="text-sm text-white/60 capitalize">
                      {planFromUrl} plan — {listingsFromUrl} listings/mo ({billingFromUrl} billing)
                    </p>
                  </div>
                </div>
              )}

              {/* Show selected plan from pricing page (non-checkout) */}
              {!checkoutSuccess && planFromUrl && planFromUrl !== 'free' && (
                <div className="mb-6 p-4 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl">
                  <p className="text-sm text-white/60">Your Selected Plan</p>
                  <p className="font-bold text-[#D4A017] capitalize">
                    {planFromUrl} — {listingsFromUrl} listings/mo {priceFromUrl ? `@ $${priceFromUrl}/listing` : ''}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4A017] outline-none"
                    aria-label="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Company (optional)</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="ABC Realty"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4A017] outline-none"
                    aria-label="Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">What describes you best?</label>
                  <div className="space-y-2">
                    {ROLES.map(role => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            selectedRole === role.id
                              ? 'border-[#D4A017] bg-[#D4A017]/10'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedRole === role.id ? 'bg-[#D4A017] text-black' : 'bg-white/10'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{role.label}</div>
                            <div className="text-xs text-white/40">{role.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name || !selectedRole}
                className="w-full mt-6 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: How It Works (quick walkthrough — was step 3) */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Here&apos;s How SnapR Works</h1>
                <p className="text-white/60">Prepare listings in seconds, not hours</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-[#D4A017]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">1. Upload Your Photos</h3>
                    <p className="text-white/60 text-sm">Drop all your listing photos at once. No sorting needed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">2. Click &quot;Prepare Listing&quot;</h3>
                    <p className="text-white/60 text-sm">AI enhances every photo automatically — same sky, same style.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">3. Done in 60 Seconds</h3>
                    <p className="text-white/60 text-sm">MLS-ready photos, description, captions, and social posts — all auto-generated.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">4. Publish Everywhere</h3>
                    <p className="text-white/60 text-sm">Property sites, social posts, videos — one platform, complete workflow.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl text-center">
                <p className="text-[#D4A017] font-medium">AI enhancements are FREE on all plans</p>
                <p className="text-white/50 text-sm mt-1">No per-photo charges. Ever.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-4 bg-white/10 rounded-xl flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Role-Specific Get Started */}
          {step === 3 && (
            <div className="animate-fadeIn text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-black" />
              </div>

              <h1 className="text-3xl font-bold mb-2">You&apos;re All Set, {name.split(' ')[0]}!</h1>
              <p className="text-white/60 mb-8">
                {selectedRole === 'broker' && 'Your brokerage command center is ready'}
                {selectedRole === 'photographer' && 'Your AI editing studio is ready'}
                {selectedRole === 'agent' && 'Let\u2019s prepare your first listing'}
                {selectedRole === 'property-manager' && 'Manage your portfolio like never before'}
                {selectedRole === 'property-owner' && 'Let\u2019s make your property shine'}
                {!selectedRole && 'Let\u2019s prepare your first listing'}
              </p>

              {/* Role-specific features */}
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-6">
                <h3 className="font-semibold text-lg mb-4">
                  {selectedRole === 'broker' ? 'Your Brokerage Toolkit:'
                    : selectedRole === 'photographer' ? 'Your Photography Toolkit:'
                    : planFromUrl && planFromUrl !== 'free'
                      ? `Your ${planFromUrl.charAt(0).toUpperCase() + planFromUrl.slice(1)} Plan Includes:`
                      : 'Your Free Plan Includes:'}
                </h3>
                <ul className="space-y-3 text-left">
                  {selectedRole === 'broker' ? (
                    <>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Team dashboard for all your agents</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Centralized listing management</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Brand consistency across all listings</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Lead pipeline &amp; analytics</span></li>
                    </>
                  ) : selectedRole === 'photographer' ? (
                    <>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>15+ AI enhancement tools</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Batch processing for entire shoots</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Client approval workflow</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Booking page for clients</span></li>
                    </>
                  ) : planFromUrl && planFromUrl !== 'free' ? (
                    <>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>{listingsFromUrl} listings per month</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Full AI preparation (all 15+ tools)</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Marketing automation &amp; content studio</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Social publishing (5 platforms)</span></li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>3 listings per month</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Full AI preparation (all 15+ tools)</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Client approval workflow</span></li>
                      <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> <span>Property site &amp; social captions</span></li>
                    </>
                  )}
                </ul>
              </div>

              {/* Primary CTA — role-specific */}
              <button
                onClick={() => {
                  if (selectedRole === 'broker') {
                    handleComplete('/dashboard/broker');
                  } else if (selectedRole === 'photographer') {
                    handleComplete('/listings/new?guided=true');
                  } else {
                    handleComplete();
                  }
                }}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : selectedRole === 'broker' ? (
                  <>Go to Brokerage Dashboard <ChevronRight className="w-5 h-5" /></>
                ) : selectedRole === 'photographer' ? (
                  <>Upload Your First Shoot <ChevronRight className="w-5 h-5" /></>
                ) : (
                  <>Create Your First Listing <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

              {/* Broker: Invite agent CTA */}
              {selectedRole === 'broker' && (
                <button
                  onClick={() => handleComplete('/dashboard/broker?invite=true')}
                  className="w-full mt-3 py-3 border border-[#D4A017]/30 rounded-xl text-[#D4A017] hover:bg-[#D4A017]/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" /> Invite Your First Agent
                </button>
              )}

              <button
                onClick={() => { handleComplete('/dashboard'); }}
                className="w-full mt-3 py-3 text-white/50 hover:text-white text-sm"
              >
                Or explore the dashboard first
              </button>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
