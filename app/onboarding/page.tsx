'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Camera, Home, Building2, Users, Briefcase, Loader2, Globe, ChevronRight, ChevronLeft, Upload, Sparkles, CheckCircle, Share2, MessageCircle, Phone } from 'lucide-react';

const REGIONS = [
  { id: 'us', label: 'United States', flag: '🇺🇸' },
  { id: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'ae', label: 'UAE', flag: '🇦🇪' },
  { id: 'au', label: 'Australia', flag: '🇦🇺' },
  { id: 'ca', label: 'Canada', flag: '🇨🇦' },
  { id: 'in', label: 'India', flag: '🇮🇳' },
  { id: 'sg', label: 'Singapore', flag: '🇸🇬' },
  { id: 'other', label: 'Other', flag: '🌍' },
];

const ROLES = [
  { id: 'photographer', label: 'Real Estate Photographer', icon: Camera, description: 'I shoot properties for clients' },
  { id: 'agent', label: 'Real Estate Agent', icon: Home, description: 'I list and sell properties' },
  { id: 'broker', label: 'Brokerage House', icon: Building2, description: 'I manage multiple agents' },
  { id: 'property-manager', label: 'Property Manager', icon: Users, description: 'I manage rental properties' },
  { id: 'property-owner', label: 'Property Owner', icon: Briefcase, description: 'I own properties to sell/rent' },
];

const VOLUME_OPTIONS = [
  { id: '1-5', label: '1-5 listings', recommended: 'Free' },
  { id: '6-20', label: '6-20 listings', recommended: 'Pro' },
  { id: '21-50', label: '21-50 listings', recommended: 'Pro' },
  { id: '50+', label: '50+ listings', recommended: 'Agency' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Step 1: Profile
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Step 2: Volume
  const [listingsPerMonth, setListingsPerMonth] = useState('');
  
  // Step 4: WhatsApp (optional)
  const [phone, setPhone] = useState('');
  const [wantsWhatsApp, setWantsWhatsApp] = useState(false);

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
      setCheckingAuth(false);
    }
    checkUser();
  }, [router, supabase]);

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save profile
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      company,
      role: selectedRole,
      region: selectedRegion,
      listings_per_month: listingsPerMonth,
      phone: wantsWhatsApp ? phone : null,
      notification_preferences: {
        email: true,
        whatsapp: wantsWhatsApp,
        transactional: 'all',
        clientEngagement: 'all',
        dailyWhatsapp: false,
        weeklySummary: true,
      },
      onboarded_at: new Date().toISOString(),
    });

    // Update user metadata
    await supabase.auth.updateUser({
      data: {
        full_name: name,
        role: selectedRole,
        region: selectedRegion,
        onboarded: true,
      }
    });

    router.push('/listings/new');
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
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          
          {/* STEP 1: Profile */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-bold text-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] shadow-lg shadow-[#D4A017]/30 mx-auto mb-4">S</div>
                <h1 className="text-3xl font-bold mb-2">Welcome to SnapR</h1>
                <p className="text-white/60">Let's set up your account</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4A017] outline-none"
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
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Your Region</label>
                  <div className="grid grid-cols-4 gap-2">
                    {REGIONS.map(region => (
                      <button
                        key={region.id}
                        onClick={() => setSelectedRegion(region.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedRegion === region.id 
                            ? 'border-[#D4A017] bg-[#D4A017]/10' 
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{region.flag}</span>
                        <span className="text-xs text-white/60">{region.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">What describes you best?</label>
                  <div className="space-y-2">
                    {ROLES.map(role => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          selectedRole === role.id 
                            ? 'border-[#D4A017] bg-[#D4A017]/10' 
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <role.icon className={`w-6 h-6 ${selectedRole === role.id ? 'text-[#D4A017]' : 'text-white/40'}`} />
                        <div className="text-left">
                          <p className="font-medium">{role.label}</p>
                          <p className="text-sm text-white/50">{role.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name || !selectedRegion || !selectedRole}
                className="w-full mt-6 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: Volume */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Your Volume</h1>
                <p className="text-white/60">Help us recommend the right plan</p>
              </div>

              <div className="space-y-3">
                {VOLUME_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setListingsPerMonth(option.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-xl border transition-all ${
                      listingsPerMonth === option.id 
                        ? 'border-[#D4A017] bg-[#D4A017]/10' 
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-lg">{option.label}</span>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      option.recommended === 'Free' ? 'bg-green-500/20 text-green-400' :
                      option.recommended === 'Pro' ? 'bg-[#D4A017]/20 text-[#D4A017]' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {option.recommended} plan
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-6 py-4 bg-white/10 rounded-xl flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!listingsPerMonth}
                  className="flex-1 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: How SnapR Works */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">How SnapR Works</h1>
                <p className="text-white/60">The listing OS that does it all</p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-[#D4A017]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">1. Upload Your Photos</h3>
                    <p className="text-white/60 text-sm">Drop all your listing photos at once. No sorting needed.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">2. Click "Prepare Listing"</h3>
                    <p className="text-white/60 text-sm">AI analyzes every photo and applies the right enhancements automatically. Same sky, same style across all photos.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">3. Done in 60 Seconds</h3>
                    <p className="text-white/60 text-sm">MLS-ready photos, not in 48 hours—in under a minute. Export or share with clients instantly.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">4. Create Marketing Content</h3>
                    <p className="text-white/60 text-sm">Social posts, videos, property sites—all from the same photos. One platform, complete workflow.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl text-center">
                <p className="text-[#D4A017] font-medium">✨ AI enhancements are FREE on all plans</p>
                <p className="text-white/50 text-sm mt-1">No per-photo charges. Ever.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="px-6 py-4 bg-white/10 rounded-xl flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: WhatsApp (Optional) */}
          {step === 4 && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Stay Connected</h1>
                <p className="text-white/60">Get instant alerts on WhatsApp (optional)</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="font-medium mb-3">What you'll receive:</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Instant alert when clients view your listings</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Notification when listings are prepared</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Client approval/feedback alerts</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Quick reply commands to take action</li>
                  </ul>
                </div>

                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer border border-white/10">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span>Enable WhatsApp notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wantsWhatsApp}
                    onChange={(e) => setWantsWhatsApp(e.target.checked)}
                    className="w-5 h-5 accent-[#D4A017]"
                  />
                </label>

                {wantsWhatsApp && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <label className="block text-sm font-medium mb-2">Your WhatsApp Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-green-400 outline-none"
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-2">Include country code. You can change this anytime in settings.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(3)} className="px-6 py-4 bg-white/10 rounded-xl flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold flex items-center justify-center gap-2"
                >
                  {wantsWhatsApp ? 'Continue' : 'Skip for now'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Get Started */}
          {step === 5 && (
            <div className="animate-fadeIn text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-black" />
              </div>
              
              <h1 className="text-3xl font-bold mb-2">You're All Set, {name.split(' ')[0]}!</h1>
              <p className="text-white/60 mb-8">Let's prepare your first listing</p>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-6">
                <h3 className="font-semibold text-lg mb-4">Your Free Plan Includes:</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400" /> <span>3 listings per month</span></li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400" /> <span>Full AI preparation (all 15 tools)</span></li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400" /> <span>Client approval workflow</span></li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400" /> <span>5 social media posts</span></li>
                  {wantsWhatsApp && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400" /> <span>WhatsApp notifications</span></li>}
                </ul>
              </div>

              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Your First Listing <ChevronRight className="w-5 h-5" /></>}
              </button>

              <button
                onClick={() => { handleComplete(); router.push('/dashboard'); }}
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
