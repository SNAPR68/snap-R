'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, Camera, Home, Users, Briefcase, Loader2, Globe, ChevronRight } from 'lucide-react';

const REGIONS = [
  { id: 'us', label: 'United States', flag: '🇺🇸', currency: 'USD', description: 'Full MLS compliance features' },
  { id: 'uk', label: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', description: '' },
  { id: 'ae', label: 'UAE', flag: '🇦🇪', currency: 'AED', description: '' },
  { id: 'sg', label: 'Singapore', flag: '🇸🇬', currency: 'SGD', description: '' },
  { id: 'in', label: 'India', flag: '🇮🇳', currency: 'INR', description: '' },
];
const ROLES = [
  { id: 'photographer', label: 'Real Estate Photographer', icon: Camera, description: 'I shoot properties for clients' },
  { id: 'agent', label: 'Real Estate Agent', icon: Home, description: 'I list and sell properties' },
  { id: 'broker', label: 'Brokerage House', icon: Building2, description: 'I manage multiple agents' },
  { id: 'property-manager', label: 'Property Manager', icon: Users, description: 'I manage rental properties' },
  { id: 'property-owner', label: 'Property Owner', icon: Briefcase, description: 'I own properties to sell/rent' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<'region' | 'details'>('region');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
  };

  const handleContinueToDetails = () => {
    if (selectedRegion) {
      setStep('details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedRole || !selectedRegion) return;
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: name,
        company,
        role: selectedRole,
        region: selectedRegion,
        onboarded: true,
        updated_at: new Date().toISOString(),
      });

      router.push('/dashboard');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4A017] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-8">
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent opacity-60" />
        <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-transparent via-[#D4A017] to-transparent opacity-60" />
        <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-gradient-to-b from-transparent via-[#D4A017] to-transparent opacity-60" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/snapr-logo.png" alt="SnapR" className="w-16 h-16" />
          <span className="text-2xl font-bold text-[#D4A017]">SnapR</span>
        </div>

        <div className="bg-[#1A1A1A]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-3 h-3 rounded-full ${step === 'region' ? 'bg-[#D4A017]' : 'bg-[#D4A017]'}`} />
            <div className={`w-12 h-0.5 ${step === 'details' ? 'bg-[#D4A017]' : 'bg-white/20'}`} />
            <div className={`w-3 h-3 rounded-full ${step === 'details' ? 'bg-[#D4A017]' : 'bg-white/20'}`} />
          </div>

          {step === 'region' ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#D4A017]/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-[#D4A017]" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Select Your Region</h1>
                <p className="text-white/60">This determines your currency and available features</p>
              </div>

              <div className="space-y-3 mb-8">
                {REGIONS.map((region) => {
                  const isSelected = selectedRegion === region.id;
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => handleRegionSelect(region.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected ? 'bg-[#D4A017]/10 border-[#D4A017] shadow-lg shadow-[#D4A017]/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <span className="text-4xl">{region.flag}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${isSelected ? 'text-[#D4A017]' : 'text-white'}`}>{region.label}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#D4A017]/20 text-[#D4A017]' : 'bg-white/10 text-white/50'}`}>{region.currency}</span>
                        </div>
                        <p className="text-white/50 text-sm">{region.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#D4A017] bg-[#D4A017]' : 'border-white/20'}`}>
                        {isSelected && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleContinueToDetails}
                disabled={!selectedRegion}
                className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Tell Us About Yourself</h1>
                <p className="text-white/60">Personalize your SnapR experience</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/60 text-sm mb-2">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]" required />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Company <span className="text-white/30">(optional)</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input type="text" placeholder="Your company name" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]" />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-3">What best describes you?</label>
                  <div className="grid gap-3">
                    {ROLES.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.id;
                      return (
                        <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)} className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected ? 'bg-[#D4A017]/10 border-[#D4A017] shadow-lg shadow-[#D4A017]/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#D4A017]' : 'bg-white/10'}`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-black' : 'text-white/60'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${isSelected ? 'text-[#D4A017]' : 'text-white'}`}>{role.label}</p>
                            <p className="text-white/50 text-sm">{role.description}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#D4A017] bg-[#D4A017]' : 'border-white/20'}`}>
                            {isSelected && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('region')}
                    className="px-6 py-4 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    Back
                  </button>
                  <button type="submit" disabled={!name || !selectedRole || loading} className="flex-1 py-4 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continue to Pricing →'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          {step === 'region' ? 'You can change your region later in settings' : 'Your information helps us customize your experience'}
        </p>
      </div>
    </div>
  );
}
