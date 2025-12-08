'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      router.push('/onboarding');
    } else {
      setError('Please check your email to confirm your account.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: `${window.location.origin}/auth/callback` } 
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
          <h1 className="text-4xl font-bold text-[#0F0F0F] mb-4">Start Your Free Trial</h1>
          <p className="text-[#0F0F0F]/70 text-lg">Get 25 free credits to experience AI-powered photo enhancement.</p>
        </div>
        <p className="text-[#0F0F0F]/50 text-sm">© 2025 SnapR</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/snapr-logo.png" alt="SnapR" className="w-16 h-16" />
            <span className="text-2xl font-bold text-[#D4A017]">SnapR</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-8">Create Account</h2>
          
          <button onClick={handleGoogleSignup} className="relative z-10 w-full py-4 px-4 rounded-xl border border-white/20 text-white hover:bg-white/5 flex items-center justify-center gap-3 mb-6">
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
            <span className="text-white/40 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]" required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]" required />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password (min 6 chars)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]" 
                required 
                minLength={6} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-white/50">
            Already have an account? <Link href="/auth/login" className="text-[#D4A017] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
