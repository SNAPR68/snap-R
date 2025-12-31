'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, Check } from 'lucide-react';
import { trackEvent, identifyUser, SnapREvents } from '@/lib/analytics';

const PLAN_INFO: Record<string, { title: string; subtitle: string; features: string[] }> = {
  free: {
    title: 'Start Your Free Account',
    subtitle: 'Get 3 free listings per month with all features.',
    features: ['3 listings/month', 'All 15 AI tools', 'Watermarked exports', 'Content Studio access'],
  },
  pro: {
    title: 'Start Your Pro Plan',
    subtitle: '30 listings/month for agents & photographers.',
    features: ['30 listings/month', 'Priority 30-sec processing', 'Clean HD exports', 'All Content Studio features', 'Virtual Tours', 'Email Marketing'],
  },
  agency: {
    title: 'Start Your Agency Plan',
    subtitle: '50 listings/month plus team collaboration.',
    features: ['50 listings/month', 'Everything in Pro', 'Team management', 'White-label exports', 'Priority support', 'API access'],
  },
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = searchParams.get('plan') || 'free';
  const listings = searchParams.get('listings') || (selectedPlan === 'agency' ? '50' : '30');
  const billing = searchParams.get('billing') || 'annual';
  
  const planInfo = PLAN_INFO[selectedPlan] || PLAN_INFO.free;
  const isPaidPlan = selectedPlan !== 'free';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    trackEvent(SnapREvents.SIGNUP_STARTED);
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { 
          full_name: name,
          selected_plan: selectedPlan,
          selected_listings: listings,
          selected_billing: billing,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?plan=${selectedPlan}&listings=${listings}&billing=${billing}`
      } 
    });
    
    if (error) { 
      setError(error.message); 
      setLoading(false); 
      return; 
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: name,
        subscription_tier: 'free',
        credits: 25,
        selected_plan: selectedPlan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      trackEvent(SnapREvents.SIGNUP_COMPLETED, { plan: selectedPlan });
      identifyUser(data.user.id, { email: data.user.email, plan: selectedPlan });
      
      if (isPaidPlan) {
        router.push(`/checkout?plan=${selectedPlan}&listings=${listings}&billing=${billing}`);
      } else {
        router.push('/onboarding');
      }
    } else {
      setError('Please check your email to confirm your account.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const redirectUrl = isPaidPlan 
      ? `${window.location.origin}/auth/callback?plan=${selectedPlan}&listings=${listings}&billing=${billing}`
      : `${window.location.origin}/auth/callback`;
      
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: redirectUrl } 
    });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/snapr-logo.png" alt="SnapR" className="w-16 h-16" />
          <span className="text-2xl font-bold text-[#0F0F0F]">SnapR</span>
        </Link>
        
        <div>
          <h1 className="text-4xl font-bold text-[#0F0F0F] mb-4">{planInfo.title}</h1>
          <p className="text-[#0F0F0F]/70 text-lg mb-8">{planInfo.subtitle}</p>
          
          <div className="space-y-3">
            {planInfo.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0F0F0F]/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#0F0F0F]" />
                </div>
                <span className="text-[#0F0F0F]/80">{feature}</span>
              </div>
            ))}
          </div>
          
          {isPaidPlan && (
            <div className="mt-8 p-4 bg-[#0F0F0F]/10 rounded-xl">
              <p className="text-[#0F0F0F]/60 text-sm">Selected plan</p>
              <p className="text-[#0F0F0F] font-bold text-xl capitalize">{selectedPlan} - {listings} listings/month</p>
              <p className="text-[#0F0F0F]/60 text-sm mt-1">You'll complete payment after creating your account</p>
            </div>
          )}
        </div>
        
        <p className="text-[#0F0F0F]/50 text-sm">© 2025 SnapR</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/snapr-logo.png" alt="SnapR" className="w-16 h-16" />
            <span className="text-2xl font-bold text-[#D4A017]">SnapR</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-white/50 mb-8">
            {isPaidPlan ? `Sign up to start your ${selectedPlan} plan` : 'Start with your free account'}
          </p>
          
          <button onClick={handleGoogleSignup} className="w-full py-4 px-4 rounded-xl border border-white/20 text-white hover:bg-white/5 flex items-center justify-center gap-3 mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-white/30 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017]" required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017]" required />
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017] pr-12" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="w-full py-4 bg-[#D4A017] hover:bg-[#B8860B] text-black font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isPaidPlan ? 'Continue to Payment' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-white/40 mt-6">
            Already have an account? <Link href="/auth/login" className="text-[#D4A017] hover:underline">Sign in</Link>
          </p>
          
          {isPaidPlan && (
            <p className="text-center text-white/30 text-sm mt-4">
              <Link href="/auth/signup" className="hover:text-white/50">Or start with free plan instead</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
