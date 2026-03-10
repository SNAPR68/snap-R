'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Users,
  Link2,
  Copy,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowRight,
  Handshake,
} from 'lucide-react';

interface PartnerStatus {
  found: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  referralCode?: string | null;
  partnerType?: string;
  appliedAt?: string;
  referralCount?: number;
}

export default function PartnerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<PartnerStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      loadPartnerStatus();
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPartnerStatus = async () => {
    try {
      const res = await fetch('/api/partners/status', { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      setPartnerData(data);
    } catch (err) {
      console.error('Failed to load partner status:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = partnerData?.referralCode
    ? `https://snap-r.com/auth/signup?ref=${partnerData.referralCode}`
    : null;

  const copyToClipboard = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  // No application found — show CTA to apply
  if (!partnerData?.found) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Handshake className="w-16 h-16 text-[#D4A017] mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Partner Program</h1>
          <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
            Earn 20% recurring commission by referring real estate professionals to SnapR.
          </p>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold hover:opacity-90 transition"
          >
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/40 text-sm mt-4">
            Applications are reviewed within 24-48 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-white/50 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-3">
            <Handshake className="w-8 h-8 text-[#D4A017]" />
            Partner Dashboard
          </h1>
          <p className="text-white/50 mt-2">
            Track your referrals and earnings
          </p>
        </div>

        {/* Application Status Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Application Status</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-sm">Partner Type</p>
              <p className="font-medium capitalize mt-1">
                {partnerData.partnerType?.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm">Applied</p>
              <p className="font-medium mt-1">
                {partnerData.appliedAt
                  ? new Date(partnerData.appliedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              {partnerData.status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" /> Pending Review
                </span>
              )}
              {partnerData.status === 'approved' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Approved
                </span>
              )}
              {partnerData.status === 'rejected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                  <XCircle className="w-4 h-4" /> Not Approved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pending state message */}
        {partnerData.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
            <p className="text-yellow-200 font-medium mb-2">Your application is under review</p>
            <p className="text-white/50 text-sm">
              We typically review applications within 24-48 hours. Once approved, your referral link
              and tracking dashboard will appear here.
            </p>
          </div>
        )}

        {/* Rejected state message */}
        {partnerData.status === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
            <p className="text-red-200 font-medium mb-2">Application not approved</p>
            <p className="text-white/50 text-sm">
              Unfortunately, your application wasn&apos;t approved at this time. If you believe this
              is an error, please contact us at{' '}
              <a href="mailto:partners@snap-r.com" className="text-[#D4A017] hover:underline">
                partners@snap-r.com
              </a>
              .
            </p>
          </div>
        )}

        {/* Approved state — Referral section */}
        {partnerData.status === 'approved' && referralLink && (
          <>
            {/* Referral Link */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#D4A017]" />
                Your Referral Link
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-sm font-mono text-white/70 truncate">
                  {referralLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-3 bg-[#D4A017] text-black rounded-lg font-medium hover:bg-[#B8860B] transition whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-3">
                Share this link with real estate professionals. You earn 20% recurring commission for
                every paid subscription.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <Users className="w-6 h-6 text-[#D4A017] mx-auto mb-2" />
                <p className="text-3xl font-bold">{partnerData.referralCount || 0}</p>
                <p className="text-white/50 text-sm mt-1">Signups</p>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <p className="text-white/40 text-xs mb-1">REFERRAL CODE</p>
                <p className="text-xl font-mono font-bold text-[#D4A017]">
                  {partnerData.referralCode}
                </p>
                <p className="text-white/50 text-sm mt-1">Your Code</p>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
                <p className="text-white/40 text-xs mb-1">COMMISSION RATE</p>
                <p className="text-3xl font-bold text-green-400">20%</p>
                <p className="text-white/50 text-sm mt-1">Recurring</p>
              </div>
            </div>

            {/* Help section */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold mb-3">Tips for Success</h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4A017]">1.</span>
                  Share your link with real estate photographers and agents in your network
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4A017]">2.</span>
                  Post about SnapR on social media with your referral link
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4A017]">3.</span>
                  Include your link in email signatures and newsletters
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4A017]">4.</span>
                  Commission is paid monthly for all active subscriptions
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Footer link */}
        <div className="mt-8 text-center">
          <Link
            href="/partners"
            className="inline-flex items-center gap-1 text-[#D4A017] hover:underline text-sm"
          >
            View Partner Program details <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
