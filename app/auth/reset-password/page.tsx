'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the recovery token as a URL fragment (#access_token=...&type=recovery)
  // exchangeCodeForSession handles both code and fragment-based flows
  useEffect(() => {
    const code = searchParams.get('code');

    async function exchangeCode() {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError('This reset link is invalid or has expired. Please request a new one.');
          return;
        }
      }
      // If no code, the fragment-based session will be picked up automatically by Supabase
      setSessionReady(true);
    }

    exchangeCode();
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Send security notification email (fire-and-forget)
    fetch('/api/auth/password-changed', { method: 'POST', signal: AbortSignal.timeout(10000) }).catch(() => {});

    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2500);
  };

  if (!sessionReady && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0F0F0F]/20 flex items-center justify-center font-bold text-[#0F0F0F] text-xl">S</div>
          <span className="text-2xl font-bold text-[#0F0F0F]">Snap<span className="text-[#0F0F0F]/80">R</span></span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-[#0F0F0F] mb-4">Create New Password</h1>
          <p className="text-[#0F0F0F]/70 text-lg">Choose a strong password to secure your account.</p>
        </div>
        <p className="text-[#0F0F0F]/50 text-sm">© 2026 SnapR</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-2xl font-bold">Snap<span className="text-[#D4A017]">R</span></span>
          </div>

          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Password updated</h2>
              <p className="text-white/50">Redirecting you to your dashboard…</p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-3">New password</h2>
              <p className="text-white/50 mb-8">Must be at least 8 characters.</p>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  {error}
                  {error.includes('invalid or has expired') && (
                    <div className="mt-2">
                      <Link href="/auth/forgot-password" className="text-[#D4A017] underline">Request a new link</Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    aria-label="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  aria-label="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
                  required
                  minLength={8}
                />

                <button
                  type="submit"
                  disabled={loading || !sessionReady}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
