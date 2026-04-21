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
    <div className="min-h-screen bg-charcoal-deep flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gold to-gold-dark p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-charcoal-deep/20 flex items-center justify-center font-bold text-surface text-xl">S</div>
          <span className="text-2xl font-bold text-surface">Snap<span className="text-surface/80">R</span></span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-surface mb-4">Reset Your Password</h1>
          <p className="text-surface/70 text-lg">We&apos;ll send you a secure link to create a new password.</p>
        </div>
        <p className="text-surface/50 text-sm">© 2026 SnapR</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-bold text-black text-xl">S</div>
            <span className="text-2xl font-bold">Snap<span className="text-primary">R</span></span>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent-gold/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <MailCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-white/50 mb-8">
                We sent a password reset link to <span className="text-white">{email}</span>.
                The link expires in 1 hour.
              </p>
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-primary hover:underline">
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
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-gold to-gold-dark text-black disabled:opacity-50 flex items-center justify-center"
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
