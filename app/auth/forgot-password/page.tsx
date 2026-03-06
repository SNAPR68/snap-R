'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#D4A017] to-[#B8860B] p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0F0F0F]/20 flex items-center justify-center font-bold text-[#0F0F0F] text-xl">S</div>
          <span className="text-2xl font-bold text-[#0F0F0F]">Snap<span className="text-[#0F0F0F]/80">R</span></span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-[#0F0F0F] mb-4">Reset Your Password</h1>
          <p className="text-[#0F0F0F]/70 text-lg">We&apos;ll send you a secure link to create a new password.</p>
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

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-8 h-8 text-[#D4A017]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-white/50 mb-8">
                We sent a password reset link to <span className="text-white">{email}</span>.
                The link expires in 1 hour.
              </p>
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-[#D4A017] hover:underline">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="flex items-center gap-2 text-white/40 hover:text-white mb-8 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>

              <h2 className="text-3xl font-bold text-white mb-3">Forgot password?</h2>
              <p className="text-white/50 mb-8">Enter your email and we&apos;ll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}
                <input
                  type="email"
                  placeholder="Email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
