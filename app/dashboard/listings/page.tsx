'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Home, ImageIcon, MapPin, CheckCircle, AlertCircle, Clock, Loader2, Megaphone, Search, ArrowUpDown, Users, Sparkles } from 'lucide-react';

// ── Types ──

interface ListingPhoto {
  id: string;
  raw_url: string | null;
  processed_url: string | null;
  status: string;
}

interface ListingRow {
  id: string;
  title: string | null;
  address: string | null;
  price: number | null;
  status: string | null;
  preparation_status: string | null;
  marketing_status: string | null;
  created_at: string;
  user_id: string;
  team_id: string | null;
  photos: ListingPhoto[];
}

interface ListingWithMeta extends Omit<ListingRow, 'photos'> {
  thumbnail: string | null;
  photoCount: number;
  isTeamListing: boolean;
}

// ── Badge helpers ──

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'prepared':
      return <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />Prepared</span>;
    case 'preparing':
      return <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium animate-pulse"><Clock className="w-3 h-3" />Preparing...</span>;
    case 'needs_review':
      return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" />Needs Review</span>;
    case 'failed':
      return <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" />Failed</span>;
    default:
      return <span className="flex items-center gap-1 px-2 py-1 bg-white/10 text-white/50 rounded-full text-xs font-medium"><Clock className="w-3 h-3" />Pending</span>;
  }
};

const getMarketingBadge = (status: string | null | undefined) => {
  if (!status) return null;
  switch (status) {
    case 'processing':
      return <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium animate-pulse"><Megaphone className="w-3 h-3" />Marketing...</span>;
    case 'completed':
      return <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium"><Megaphone className="w-3 h-3" />Marketed</span>;
    case 'skipped':
      return null;
    case 'failed':
      return <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium"><AlertCircle className="w-3 h-3" />Marketing Failed</span>;
    default:
      return null;
  }
};

// ── Pipeline progress indicator ──

function ListingProgressBar({ listing }: { listing: ListingWithMeta }) {
  const steps = [
    { label: 'Upload', done: listing.photoCount > 0 },
    { label: 'Enhance', done: listing.preparation_status === 'prepared' },
    { label: 'Marketing', done: listing.marketing_status === 'completed' },
  ]
  const completedCount = steps.filter(s => s.done).length

  // Don't show if all steps are done
  if (completedCount === steps.length) return null

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center gap-1 mb-1.5">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            <div className={`h-1.5 rounded-full flex-1 transition-colors ${step.done ? 'bg-accent-gold' : 'bg-white/10'}`} />
            {i < steps.length - 1 && <div className="w-0.5" />}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {steps.map((step) => (
          <span key={step.label} className={`text-[10px] ${step.done ? 'text-primary' : 'text-white/25'}`}>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type SortOption = 'newest' | 'oldest' | 'title'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'prepared', label: 'Prepared' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'marketed', label: 'Marketed' },
  { key: 'failed', label: 'Failed' },
] as const

export default function ListingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [listings, setListings] = useState<ListingWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSample, setCreatingSample] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchListings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    // Fetch user's team_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_team_id')
      .eq('id', user.id)
      .single();

    const teamId = profile?.current_team_id as string | null;

    // Fetch own listings
    const { data: ownListings } = await supabase
      .from('listings')
      .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch team listings (if user has a team)
    let teamListings: ListingRow[] = [];
    if (teamId) {
      const { data: teamData } = await supabase
        .from('listings')
        .select('*, photos!photos_listing_id_fkey(id, raw_url, processed_url, status)')
        .eq('team_id', teamId)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });
      teamListings = (teamData ?? []) as ListingRow[];
    }

    const allListings = [
      ...((ownListings ?? []) as ListingRow[]).map(l => ({ ...l, _isTeam: false })),
      ...teamListings.map(l => ({ ...l, _isTeam: true })),
    ];

    // Deduplicate by id (in case a team listing is also owned)
    const seen = new Set<string>();
    const deduped = allListings.filter(l => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });

    const withThumbnails: ListingWithMeta[] = await Promise.all(
      deduped.map(async (listing) => {
        const photos = listing.photos || [];
        const firstPhoto = photos.find((p: ListingPhoto) => p.processed_url) || photos[0];
        let thumbnail: string | null = null;
        if (firstPhoto) {
          const path = firstPhoto.processed_url || firstPhoto.raw_url;
          if (path && !path.startsWith('http')) {
            const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
            thumbnail = data?.signedUrl ?? null;
          } else {
            thumbnail = path;
          }
        }
        const isTeam = listing._isTeam;
        return {
          id: listing.id,
          title: listing.title,
          address: listing.address,
          price: listing.price,
          status: listing.status,
          preparation_status: listing.preparation_status,
          marketing_status: listing.marketing_status,
          created_at: listing.created_at,
          user_id: listing.user_id,
          team_id: listing.team_id,
          thumbnail,
          photoCount: photos.length,
          isTeamListing: isTeam,
        };
      })
    );
    setListings(withThumbnails);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleCreateSample = async () => {
    setCreatingSample(true);
    try {
      const res = await fetch('/api/listing/sample', { method: 'POST', signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (data.id) {
        router.push(`/dashboard/studio?id=${data.id}`);
      }
    } catch {
      setCreatingSample(false);
    }
  };

  const filteredListings = useMemo(() => {
    let result = listings;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.title || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(l => {
        const prepStatus = l.preparation_status ?? l.status;
        const mktStatus = l.marketing_status;
        if (statusFilter === 'marketed') return mktStatus === 'completed';
        if (statusFilter === 'marketing') return mktStatus === 'processing';
        if (statusFilter === 'failed') return prepStatus === 'failed' || mktStatus === 'failed';
        return prepStatus === statusFilter;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [listings, searchQuery, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold editorial-headline">My Listings</h1>
            <p className="text-white/50 mt-1">
              {filteredListings.length === listings.length
                ? `${listings.length} properties`
                : `Showing ${filteredListings.length} of ${listings.length} properties`
              }
            </p>
          </div>
          <Link href="/listings/new" className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400">
            <Plus className="w-5 h-5" />New Listing
          </Link>
        </div>

        {/* Search + Filters */}
        {listings.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title or address..."
                className="w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Status Filters */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === key
                      ? 'bg-accent-gold text-black shadow-[0_0_12px_rgba(212,160,23,0.4)]'
                      : 'glass-luxury text-white/60 hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-8 pr-8 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>
        )}

        {listings.length === 0 ? (
          <div className="py-12 glass-luxury glossy-top rounded-2xl">
            {/* Welcome header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-bold text-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/30 mx-auto mb-4">S</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to SnapR</h2>
              <p className="text-white/50 max-w-lg mx-auto">
                Transform ordinary property photos into luxury showcases, then auto-generate all your marketing in seconds.
              </p>
            </div>

            {/* 3-step visual guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto px-6 mb-10">
              <div className="text-center p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-semibold text-primary mb-1">Step 1</div>
                <h4 className="font-semibold mb-1">Upload Photos</h4>
                <p className="text-xs text-white/40">Drop all your listing photos. No sorting needed.</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-xs font-semibold text-purple-400 mb-1">Step 2</div>
                <h4 className="font-semibold mb-1">AI Enhances</h4>
                <p className="text-xs text-white/40">Sky replacement, virtual staging, HDR -- all automatic.</p>
              </div>
              <div className="text-center p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-xs font-semibold text-green-400 mb-1">Step 3</div>
                <h4 className="font-semibold mb-1">Marketing Ready</h4>
                <p className="text-xs text-white/40">Description, captions, property site, and social posts.</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-6">
              <Link href="/listings/new" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-gold/20">
                <Plus className="w-5 h-5" />Upload Your First Listing
              </Link>
              <button
                onClick={handleCreateSample}
                disabled={creatingSample}
                className="inline-flex items-center gap-2 px-6 py-3 border border-primary/40 text-primary rounded-xl font-semibold hover:bg-accent-gold/10 transition-colors disabled:opacity-50"
              >
                {creatingSample ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Try with Sample Photos
              </button>
            </div>
            <div className="text-center mt-4">
              <Link href="/#demo-video" className="text-white/30 hover:text-white/50 text-xs underline underline-offset-2 transition-colors">
                Watch Demo Video
              </Link>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 glass-luxury rounded-2xl">
            <Search className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No matches found</h3>
            <p className="text-white/40 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Link key={listing.id} href={'/dashboard/studio?id=' + listing.id} className="group glass-luxury glossy-top overflow-hidden hover:border-primary/40 transition-all" style={{ borderRadius: '16px' }}>
                <div className="aspect-video relative">
                  {listing.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <Image src={listing.thumbnail} alt={listing.title || 'Listing photo'} className="w-full h-full object-cover" width={400} height={300} unoptimized />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Home className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg text-xs">
                    <ImageIcon className="w-3 h-3" />{listing.photoCount}
                  </div>
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {getStatusBadge(listing.preparation_status ?? listing.status ?? '')}
                    {getMarketingBadge(listing.marketing_status)}
                    {listing.isTeamListing && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">
                        <Users className="w-3 h-3" />Team
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate group-hover:text-amber-400 transition-colors">
                    {listing.title || listing.address || 'Untitled'}
                  </h3>
                  {listing.address && (
                    <p className="text-white/50 text-sm flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{listing.address}
                    </p>
                  )}
                  {listing.price && <p className="text-amber-400 font-semibold mt-2">${listing.price.toLocaleString()}</p>}
                  {/* Pipeline progress indicator */}
                  <ListingProgressBar listing={listing} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
