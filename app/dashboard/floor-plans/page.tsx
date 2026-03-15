'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Home, ChevronRight, Download, Trash2,
  Eye, Grid3X3, Sparkles, Settings2, Check,
} from 'lucide-react';
import NextImage from 'next/image';
import { PLAN_TYPES, STYLES, COLOR_SCHEMES } from '@/lib/floorplans/config';

interface FloorPlan {
  id: string;
  name: string;
  plan_type: string;
  style: string;
  color_scheme: string;
  total_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: { name: string; type: string; estimatedSqft?: number; floor?: number; features?: string[] }[];
  image_url: string | null;
  pdf_url: string | null;
  status: string;
  processing_method: string | null;
  show_dimensions: boolean;
  show_furniture: boolean;
  show_room_names: boolean;
  show_sqft: boolean;
  created_at: string;
  completed_at: string | null;
  listing_id: string | null;
}

interface ListingOption {
  id: string;
  title: string;
  address: string | null;
  photoUrl: string | null;
  photoCount: number;
}

export default function FloorPlansPage() {
  const supabase = createClient();

  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [viewPlan, setViewPlan] = useState<FloorPlan | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string>('2d-basic');
  const [style, setStyle] = useState<string>('modern');
  const [colorScheme, setColorScheme] = useState<string>('color');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showFurniture, setShowFurniture] = useState(false);
  const [showRoomNames, setShowRoomNames] = useState(true);
  const [showSqft, setShowSqft] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [plansResult, listingsResult] = await Promise.all([
        supabase
          .from('floor_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('listings')
          .select('id, title, address, photos!photos_listing_id_fkey(id, processed_url, raw_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (plansResult.data) {
        setFloorPlans(plansResult.data as FloorPlan[]);
      }

      if (listingsResult.data) {
        const mapped: ListingOption[] = [];
        for (const listing of listingsResult.data) {
          const photos = (listing.photos || []) as unknown as { id: string; processed_url: string | null; raw_url: string }[];
          let photoUrl: string | null = null;
          const firstPhoto = photos[0];
          if (firstPhoto) {
            const url = firstPhoto.processed_url || firstPhoto.raw_url;
            if (url && url.startsWith('http')) {
              photoUrl = url;
            } else if (url) {
              const { data: signedData } = await supabase.storage.from('raw-images').createSignedUrl(url, 3600);
              photoUrl = signedData?.signedUrl ?? null;
            }
          }
          mapped.push({
            id: listing.id,
            title: listing.title,
            address: listing.address ?? null,
            photoUrl,
            photoCount: photos.length,
          });
        }
        setListings(mapped);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async (listingId: string) => {
    setGenerating(listingId);
    setGenError(null);
    try {
      const res = await fetch('/api/floor-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          planType,
          style,
          colorScheme,
          options: { showDimensions, showFurniture, showRoomNames, showSqft, includeBranding: false },
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || 'Generation failed');
        return;
      }
      await loadData();
      setShowConfig(false);
      setSelectedListing(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGenError(message);
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this floor plan?')) return;
    await supabase.from('floor_plans').delete().eq('id', planId);
    setFloorPlans(floorPlans.filter(p => p.id !== planId));
    if (viewPlan?.id === planId) setViewPlan(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0F0F0F]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Grid3X3 className="w-7 h-7 text-amber-400" />
                AI Floor Plans
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Generate floor plans from your listing photos using AI analysis
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-purple-400">AI-Powered</span>
              <p className="text-sm text-white/50 mt-1">GPT-4 Vision analysis</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-amber-400">4 Styles</span>
              <p className="text-sm text-white/50 mt-1">Modern to detailed</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-blue-400">SVG + PDF</span>
              <p className="text-sm text-white/50 mt-1">Print-ready output</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Existing Floor Plans */}
        {floorPlans.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Your Floor Plans</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {floorPlans.map(plan => (
                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                  {/* Preview */}
                  <div className="aspect-[4/3] bg-white/5 relative flex items-center justify-center">
                    {plan.image_url ? (
                      plan.image_url.startsWith('data:') ? (
                        // SVG data URL - render inline
                        <div
                          className="w-full h-full p-4"
                          dangerouslySetInnerHTML={{
                            __html: atob(plan.image_url.replace('data:image/svg+xml;base64,', ''))
                          }}
                        />
                      ) : (
                        <NextImage
                          src={plan.image_url}
                          alt={plan.name}
                          fill
                          className="object-contain p-4"
                          unoptimized
                        />
                      )
                    ) : (
                      <Grid3X3 className="w-16 h-16 text-white/20" />
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      {plan.status === 'completed' ? (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Complete
                        </span>
                      ) : plan.status === 'processing' ? (
                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      ) : (
                        <span className="bg-white/10 text-white/50 text-xs px-2 py-1 rounded-full">
                          {plan.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{plan.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-white/50 mt-1">
                      <span>{PLAN_TYPES[plan.plan_type as keyof typeof PLAN_TYPES]?.label || plan.plan_type}</span>
                      <span>&middot;</span>
                      <span>{plan.rooms?.length || 0} rooms</span>
                      {plan.total_sqft && (
                        <>
                          <span>&middot;</span>
                          <span>{plan.total_sqft.toLocaleString()} sqft</span>
                        </>
                      )}
                    </div>

                    {/* Room list */}
                    {plan.rooms && plan.rooms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {plan.rooms.slice(0, 6).map((room, i) => (
                          <span key={i} className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded">
                            {room.name}
                          </span>
                        ))}
                        {plan.rooms.length > 6 && (
                          <span className="text-white/30 text-xs py-0.5">+{plan.rooms.length - 6} more</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setViewPlan(plan)}
                        className="flex-1 flex items-center justify-center gap-2 bg-amber-500/20 text-amber-400 py-2 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                      {plan.image_url && (
                        <a
                          href={plan.image_url}
                          download={`${plan.name}.svg`}
                          className="flex items-center justify-center gap-2 bg-white/10 text-white/70 py-2 px-4 rounded-lg hover:bg-white/20 transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="flex items-center justify-center gap-2 bg-white/10 text-white/70 py-2 px-4 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate New */}
        <h2 className="text-xl font-bold mb-4">Generate Floor Plan</h2>

        {genError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{genError}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Listing selector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Select a Listing
            </h3>
            <p className="text-white/50 text-sm mb-4">
              AI will analyze your listing photos to detect rooms and generate a floor plan.
            </p>

            {listings.length === 0 ? (
              <p className="text-white/50 text-sm">No listings yet. Create a listing first.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {listings.map(listing => (
                  <button
                    key={listing.id}
                    onClick={() => {
                      setSelectedListing(listing.id);
                      setShowConfig(true);
                    }}
                    disabled={generating === listing.id}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedListing === listing.id
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    } disabled:opacity-50`}
                  >
                    {generating === listing.id ? (
                      <Loader2 className="w-10 h-10 animate-spin text-purple-400 shrink-0" />
                    ) : listing.photoUrl ? (
                      <NextImage
                        src={listing.photoUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                        width={40} height={40} unoptimized
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Home className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.title || listing.address}</p>
                      <p className="text-xs text-white/50">{listing.photoCount} photos</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration */}
          {showConfig && selectedListing && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                Floor Plan Options
              </h3>

              {/* Plan Type */}
              <div className="mb-4">
                <label className="text-sm text-white/70 mb-2 block">Plan Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PLAN_TYPES).map(pt => (
                    <button
                      key={pt.id}
                      onClick={() => setPlanType(pt.id)}
                      className={`p-3 rounded-lg text-left text-sm transition-colors ${
                        planType === pt.id
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <p className="font-medium">{pt.label}</p>
                      <p className="text-white/50 text-xs mt-0.5">{pt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="mb-4">
                <label className="text-sm text-white/70 mb-2 block">Style</label>
                <div className="flex gap-2">
                  {Object.values(STYLES).map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`flex-1 p-2 rounded-lg text-center text-sm transition-colors ${
                        style === s.id
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Scheme */}
              <div className="mb-4">
                <label className="text-sm text-white/70 mb-2 block">Color Scheme</label>
                <div className="flex gap-2">
                  {Object.values(COLOR_SCHEMES).map(cs => (
                    <button
                      key={cs.id}
                      onClick={() => setColorScheme(cs.id)}
                      className={`flex-1 p-2 rounded-lg text-center text-sm transition-colors ${
                        colorScheme === cs.id
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {cs.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle options */}
              <div className="space-y-2 mb-6">
                {[
                  { label: 'Show Dimensions', value: showDimensions, setter: setShowDimensions },
                  { label: 'Show Furniture', value: showFurniture, setter: setShowFurniture },
                  { label: 'Show Room Names', value: showRoomNames, setter: setShowRoomNames },
                  { label: 'Show Sqft', value: showSqft, setter: setShowSqft },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white/70">{opt.label}</span>
                    <button
                      onClick={() => opt.setter(!opt.value)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        opt.value ? 'bg-amber-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 mt-1 ${
                        opt.value ? 'translate-x-4' : ''
                      }`} />
                    </button>
                  </label>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={() => handleGenerate(selectedListing)}
                disabled={!!generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-amber-500 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Photos...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Floor Plan
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewPlan && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Floor plan viewer"
        >
          <div className="bg-[#1A1A1A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">{viewPlan.name}</h2>
              <button
                onClick={() => setViewPlan(null)}
                className="text-white/50 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {/* Floor plan image */}
              {viewPlan.image_url && (
                <div className="bg-white rounded-xl p-4 mb-6">
                  {viewPlan.image_url.startsWith('data:') ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: atob(viewPlan.image_url.replace('data:image/svg+xml;base64,', ''))
                      }}
                    />
                  ) : (
                    <NextImage
                      src={viewPlan.image_url}
                      alt={viewPlan.name}
                      width={800}
                      height={600}
                      className="w-full h-auto"
                      unoptimized
                    />
                  )}
                </div>
              )}

              {/* Room breakdown */}
              {viewPlan.rooms && viewPlan.rooms.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Room Breakdown</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {viewPlan.rooms.map((room, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{room.name}</span>
                          {room.estimatedSqft && (
                            <span className="text-amber-400 text-sm">{room.estimatedSqft} sqft</span>
                          )}
                        </div>
                        {room.features && room.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.features.map((f, j) => (
                              <span key={j} className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
