'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, ExternalLink, ChevronRight, Loader2, Copy, Plus, Link2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ApprovalListing {
  id: string;
  title: string;
  address: string;
  thumbnail: string;
  shareToken: string;
  stats: {
    approved: number;
    rejected: number;
    pending: number;
    total: number;
  };
  lastActivity: string;
}

interface ListingOption {
  id: string;
  title: string | null;
  address: string | null;
}

function NewApprovalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('listings')
          .select('id, title, address')
          .order('created_at', { ascending: false });
        setListings(data || []);
        if (data && data.length > 0) setSelectedId(data[0].id);
      } catch {
        // ignore
      } finally {
        setLoadingListings(false);
      }
    };
    loadListings();
  }, []);

  const handleCreate = async () => {
    if (!selectedId) return;
    setCreating(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: selectedId }),
      });
      const data = await res.json();
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
        onCreated();
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create approval link">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4A017]/20 rounded-lg flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[#D4A017]" />
            </div>
            <h2 className="text-lg font-semibold">New Approval Link</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        {shareUrl ? (
          <div className="space-y-4">
            <p className="text-white/60 text-sm">Share this link with your client to collect photo approvals.</p>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
              <span className="flex-1 text-sm text-white/80 truncate">{shareUrl}</span>
              <button
                onClick={copyLink}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-[#D4A017] hover:text-[#D4A017]/80 transition-colors font-medium"
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm block mb-2" aria-label="Select listing">Select listing</label>
              {loadingListings ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                </div>
              ) : listings.length === 0 ? (
                <p className="text-white/40 text-sm py-2">No listings found. Create a listing first.</p>
              ) : (
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  aria-label="Select listing"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4A017]/50 appearance-none"
                >
                  {listings.map(l => (
                    <option key={l.id} value={l.id} className="bg-[#1A1A1A]">
                      {l.title || l.address || l.id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !selectedId || loadingListings}
                className="flex-1 py-2.5 bg-[#D4A017] hover:bg-[#D4A017]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-black transition-colors flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const [listings, setListings] = useState<ApprovalListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approval-summary');
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(`https://snap-r.com/share/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredListings = listings.filter(l => {
    if (filter === 'pending') return l.stats.pending > 0;
    if (filter === 'complete') return l.stats.pending === 0 && l.stats.total > 0;
    return true;
  });

  const totalStats = listings.reduce(
    (acc, l) => ({
      approved: acc.approved + l.stats.approved,
      rejected: acc.rejected + l.stats.rejected,
      pending: acc.pending + l.stats.pending,
    }),
    { approved: 0, rejected: 0, pending: 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      {showModal && (
        <NewApprovalModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            fetchApprovals();
          }}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Client Approvals</h1>
            <p className="text-white/60">Track client feedback across all your shared galleries</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#D4A017]/90 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Approval Link
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-white/60 text-sm">Approved</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{totalStats.approved}</div>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-white/60 text-sm">Rejected</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{totalStats.rejected}</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-white/60 text-sm">Pending</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{totalStats.pending}</div>
          </div>

          <div className="bg-gradient-to-br from-[#D4A017]/20 to-[#B8860B]/10 border border-[#D4A017]/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#D4A017]/20 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-[#D4A017]" />
              </div>
              <span className="text-white/60 text-sm">Shared Galleries</span>
            </div>
            <div className="text-3xl font-bold text-[#D4A017]">{listings.length}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'complete'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#D4A017] text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All Galleries' : f === 'pending' ? 'Awaiting Review' : 'Complete'}
            </button>
          ))}
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl">
            <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No galleries found</h3>
            <p className="text-white/50 text-sm">
              {filter === 'pending'
                ? "All galleries have been reviewed!"
                : "Share a gallery with a client to get started."}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#D4A017]/20 hover:bg-[#D4A017]/30 border border-[#D4A017]/30 rounded-lg text-sm text-[#D4A017] transition-colors"
              >
                <Plus className="w-4 h-4" /> Create your first approval link
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <div
                key={listing.id}
                className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 hover:border-[#D4A017]/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                    {listing.thumbnail ? (
                      <Image src={listing.thumbnail} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                    <p className="text-white/50 text-sm truncate">{listing.address || 'No address'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => copyShareLink(listing.shareToken)}
                        className="text-xs text-[#D4A017] hover:underline flex items-center gap-1"
                      >
                        {copiedToken === listing.shareToken ? (
                          <>✓ Copied</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copy share link</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{listing.stats.approved}</div>
                        <div className="text-xs text-white/40">Approved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-400">{listing.stats.rejected}</div>
                        <div className="text-xs text-white/40">Rejected</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-400">{listing.stats.pending}</div>
                        <div className="text-xs text-white/40">Pending</div>
                      </div>
                    </div>

                    <div className="w-24">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          style={{ width: listing.stats.total > 0 ? `${(listing.stats.approved / listing.stats.total) * 100}%` : '0%' }}
                        />
                      </div>
                      <div className="text-xs text-white/40 text-center mt-1">
                        {listing.stats.total > 0 ? Math.round((listing.stats.approved / listing.stats.total) * 100) : 0}% approved
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/studio?id=${listing.id}`}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                        title="Open in Studio"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
