'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, ExternalLink, Download, ChevronRight, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';

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

export default function ApprovalsPage() {
  const [listings, setListings] = useState<ApprovalListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'complete'>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Approvals</h1>
          <p className="text-white/60">Track client feedback across all your shared galleries</p>
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
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map(listing => (
              <div
                key={listing.id}
                className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 hover:border-[#D4A017]/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                    {listing.thumbnail ? (
                      <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
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
