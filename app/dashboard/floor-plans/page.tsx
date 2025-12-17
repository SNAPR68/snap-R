'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Home, ChevronRight, Download, RefreshCw,
  Check, Clock, DollarSign, Lightbulb, Bed, Bath,
  Square, Star, Plus, LayoutGrid, Box, MousePointer, Grid,
  Sparkles, ArrowLeft, Palette, Settings2
} from 'lucide-react';

// Plan Types Configuration
const PLAN_TYPES = {
  '2d-basic': {
    id: '2d-basic',
    label: '2D Basic',
    description: 'Clean black & white floor plan',
    price: 20,
    turnaround: '~30 seconds',
    icon: LayoutGrid,
    features: ['Room labels', 'Dimensions', 'Total sqft', 'PNG download'],
    popular: false,
  },
  '2d-branded': {
    id: '2d-branded',
    label: '2D Branded',
    description: 'Colored with furniture icons',
    price: 35,
    turnaround: '~30 seconds',
    icon: Grid,
    features: ['Color-coded rooms', 'Furniture icons', 'Elegant styling', 'High-res'],
    popular: true,
  },
  '3d-isometric': {
    id: '3d-isometric',
    label: '3D Isometric',
    description: '3D dollhouse view',
    price: 50,
    turnaround: '~30 seconds',
    icon: Box,
    features: ['3D visualization', 'Furniture shown', 'Realistic shadows', 'Premium quality'],
    popular: false,
  },
  'interactive': {
    id: 'interactive',
    label: '3D Premium',
    description: 'Magazine-quality render',
    price: 75,
    turnaround: '~30 seconds',
    icon: MousePointer,
    features: ['Photorealistic', 'Luxury styling', 'Marketing ready', 'Best quality'],
    popular: false,
  },
};

type PlanTypeKey = keyof typeof PLAN_TYPES;
type PlanTypeValue = typeof PLAN_TYPES[PlanTypeKey];

const STYLES = [
  { id: 'modern', label: 'Modern', description: 'Clean, minimal lines' },
  { id: 'classic', label: 'Classic', description: 'Traditional style' },
  { id: 'minimal', label: 'Minimal', description: 'Ultra-simple' },
  { id: 'detailed', label: 'Detailed', description: 'Full fixtures' },
];

const COLOR_SCHEMES = [
  { id: 'color', label: 'Full Color', color: 'bg-gradient-to-r from-blue-400 to-purple-400' },
  { id: 'grayscale', label: 'Grayscale', color: 'bg-gradient-to-r from-gray-400 to-gray-600' },
  { id: 'blueprint', label: 'Blueprint', color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
];

interface Listing {
  id: string;
  title: string;
  address?: string;
  thumbnail?: string | null;
  photoCount: number;
}

interface FloorPlan {
  id: string;
  name: string;
  plan_type: string;
  image_url?: string;
  status: string;
  total_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  created_at: string;
}

// Plan Type Card
function PlanTypeCard({ type, selected, onClick }: { type: PlanTypeValue; selected: boolean; onClick: () => void }) {
  const Icon = type.icon;
  
  return (
    <button
      onClick={onClick}
      className={`relative p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
        selected
          ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500'
          : 'bg-white/5 border-white/10 hover:border-white/30'
      }`}
    >
      {type.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" /> POPULAR
        </div>
      )}
      
      <Icon className={`w-8 h-8 mb-3 ${selected ? 'text-blue-400' : 'text-white/50'}`} />
      
      <h3 className="text-base font-bold mb-1">{type.label}</h3>
      <p className="text-xs text-white/50 mb-3">{type.description}</p>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl font-bold text-blue-400">${type.price}</span>
        <span className="text-xs text-white/40">{type.turnaround}</span>
      </div>
      
      <ul className="space-y-1">
        {type.features.slice(0, 3).map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-white/60">
            <Check className="w-3 h-3 text-green-400" />
            {feature}
          </li>
        ))}
      </ul>
    </button>
  );
}

// Floor Plan Generator
function FloorPlanGenerator({
  listingId,
  listingTitle,
  photoUrls,
  onBack,
}: {
  listingId?: string;
  listingTitle?: string;
  photoUrls: string[];
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [planType, setPlanType] = useState<string>('2d-branded');
  const [style, setStyle] = useState('modern');
  const [colorScheme, setColorScheme] = useState('color');
  const [propertyDetails, setPropertyDetails] = useState({
    sqft: '',
    bedrooms: '3',
    bathrooms: '2',
    floors: '1',
  });
  const [processing, setProcessing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);

  const selectedPlan = PLAN_TYPES[planType as PlanTypeKey];
  const totalPrice = selectedPlan.price;

  const handleGenerate = async (isRegenerate = false) => {
    if (isRegenerate) {
      setRegenerating(true);
    } else {
      setProcessing(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/floor-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          planType,
          style,
          colorScheme,
          sourcePhotos: photoUrls,
          propertyDetails: {
            sqft: propertyDetails.sqft ? parseInt(propertyDetails.sqft) : undefined,
            bedrooms: propertyDetails.bedrooms ? parseInt(propertyDetails.bedrooms) : 3,
            bathrooms: propertyDetails.bathrooms ? parseFloat(propertyDetails.bathrooms) : 2,
            floors: parseInt(propertyDetails.floors) || 1,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate floor plan');
      }

      setResult(data);
      setGenerationCount(prev => prev + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
      setRegenerating(false);
    }
  };

  // Result view with Regenerate button
  if (result) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {result.imageUrl ? 'Floor Plan Ready!' : 'Order Placed!'}
                </h1>
                <p className="text-white/50">{selectedPlan.label} • Generation #{generationCount}</p>
              </div>
            </div>
            <button onClick={onBack} className="text-white/50 hover:text-white">
              ← Back to listings
            </button>
          </div>

          {/* Generated Image */}
          {result.imageUrl ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
              <img
                src={result.imageUrl}
                alt="Floor Plan"
                className="w-full"
              />
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-amber-400 mb-2">Order Confirmed</h3>
              <p className="text-white/70 mb-4">{result.message}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Estimated: {new Date(result.estimatedDelivery).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  ${result.price}
                </span>
              </div>
            </div>
          )}

          {/* Room Analysis */}
          {result.analysis?.rooms && result.analysis.rooms.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Room Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.analysis.rooms.slice(0, 8).map((room: any, i: number) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium">{room.name}</div>
                    <div className="text-xs text-white/50">{room.sqft || room.estimatedSqft} sq ft</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Square className="w-4 h-4" />
                  {result.analysis.totalSqft || '~2000'} sq ft
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {result.analysis.bedrooms || 3} beds
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  {result.analysis.bathrooms || 2} baths
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Create Another
            </button>
            
            {result.imageUrl && (
              <>
                {/* Regenerate Button */}
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={regenerating}
                  className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Regenerate
                    </>
                  )}
                </button>
                
                {/* Download Button */}
                <a
                  href={result.imageUrl}
                  download={`floor-plan-${planType}-${Date.now()}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold text-center hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
              </>
            )}
          </div>

          {/* Regenerate Info */}
          {result.imageUrl && (
            <p className="text-center text-white/40 text-sm mt-4">
              Not happy with the result? Click Regenerate for a new variation. Each regeneration costs ~$0.08.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
              <LayoutGrid className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create Floor Plan</h1>
              <p className="text-white/50">{listingTitle || 'New Floor Plan'}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { num: 1, label: 'Plan Type' },
            { num: 2, label: 'Style' },
            { num: 3, label: 'Details' },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => step > s.num && setStep(s.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step >= s.num ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </span>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </button>
              {i < 2 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-blue-500' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Choose Plan Type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Choose Plan Type</h2>
            <p className="text-white/50 mb-6">Select the style of floor plan you need</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.values(PLAN_TYPES).map((type) => (
                <PlanTypeCard
                  key={type.id}
                  type={type}
                  selected={planType === type.id}
                  onClick={() => setPlanType(type.id)}
                />
              ))}
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Style Options */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Customize Style</h2>
            <p className="text-white/50 mb-6">Choose the look and feel</p>
            
            {/* Style */}
            <div className="mb-6">
              <label className="text-sm text-white/60 mb-3 block flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Architectural Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      style === s.id
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-white/50">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Scheme */}
            <div className="mb-6">
              <label className="text-sm text-white/60 mb-3 block flex items-center gap-2">
                <Palette className="w-4 h-4" /> Color Scheme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {COLOR_SCHEMES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColorScheme(c.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      colorScheme === c.id
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-full h-3 rounded-full mb-2 ${c.color}`} />
                    <div className="font-medium text-sm">{c.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Property Details & Generate */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Property Details</h2>
            <p className="text-white/50 mb-6">Help AI understand your property better</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Left: Details */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-medium mb-4">Property Info</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Total Sq Ft (optional)</label>
                    <input
                      type="number"
                      value={propertyDetails.sqft}
                      onChange={(e) => setPropertyDetails(p => ({ ...p, sqft: e.target.value }))}
                      placeholder="e.g., 2500"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Beds</label>
                      <input
                        type="number"
                        value={propertyDetails.bedrooms}
                        onChange={(e) => setPropertyDetails(p => ({ ...p, bedrooms: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Baths</label>
                      <input
                        type="number"
                        step="0.5"
                        value={propertyDetails.bathrooms}
                        onChange={(e) => setPropertyDetails(p => ({ ...p, bathrooms: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1 block">Floors</label>
                      <input
                        type="number"
                        value={propertyDetails.floors}
                        onChange={(e) => setPropertyDetails(p => ({ ...p, floors: e.target.value }))}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="font-medium mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-white/60">Plan Type</span>
                    <span className="font-medium">{selectedPlan.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Style</span>
                    <span className="font-medium capitalize">{style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Color Scheme</span>
                    <span className="font-medium capitalize">{colorScheme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Source Photos</span>
                    <span className="font-medium">{photoUrls.length} photos</span>
                  </div>
                  <hr className="border-white/10" />
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-blue-400">${totalPrice}</span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 text-sm text-white/60">
                  <Sparkles className="w-4 h-4 inline mr-2 text-purple-400" />
                  AI will analyze your photos and generate a professional floor plan in ~30 seconds
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => handleGenerate(false)}
                disabled={processing}
                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Floor Plan
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Listing Selector
function ListingSelector({
  onSelect,
  onUpload,
}: {
  onSelect: (listing: any, photos: string[]) => void;
  onUpload: () => void;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [existingPlans, setExistingPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load listings
    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, title, address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingsData) {
      const listingsWithPhotos = await Promise.all(
        listingsData.map(async (listing) => {
          const { count } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', listing.id);

          const { data: thumbnail } = await supabase
            .from('photos')
            .select('processed_url, raw_url')
            .eq('listing_id', listing.id)
            .limit(1)
            .single();

          let thumbnailUrl = null;
          if (thumbnail) {
            const path = thumbnail.processed_url || thumbnail.raw_url;
            const { data: signedUrl } = await supabase.storage
              .from('raw-images')
              .createSignedUrl(path, 3600);
            thumbnailUrl = signedUrl?.signedUrl;
          }

          return {
            id: listing.id,
            title: listing.title || listing.address || 'Untitled',
            address: listing.address,
            thumbnail: thumbnailUrl,
            photoCount: count || 0,
          };
        })
      );
      setListings(listingsWithPhotos);
    }

    // Load existing floor plans
    const { data: plansData } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    if (plansData) {
      setExistingPlans(plansData);
    }

    setLoading(false);
  };

  const handleSelectListing = async (listing: Listing) => {
    const supabase = createClient();
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: true });

    const urls = await Promise.all(
      (photos || []).map(async (photo) => {
        const path = photo.processed_url || photo.raw_url;
        const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
        return data?.signedUrl || '';
      })
    );

    onSelect(listing, urls.filter(u => u));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
            <LayoutGrid className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Floor Plans</h1>
            <p className="text-white/50">AI-powered 2D & 3D floor plans in seconds</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">AI Floor Plan Generator</h3>
              <p className="text-sm text-white/70">
                Upload photos or select a listing. Our AI analyzes your images and generates professional 
                floor plans in ~30 seconds. Choose from 2D schematics, colored plans, or stunning 3D renders.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Floor Plans */}
        {existingPlans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Your Floor Plans</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {existingPlans.map((plan) => (
                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                  {plan.image_url ? (
                    <img src={plan.image_url} alt={plan.name} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium truncate">{plan.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-white/50">
                        {PLAN_TYPES[plan.plan_type as PlanTypeKey]?.label || plan.plan_type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        plan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        plan.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {plan.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Select Listing */}
        <h2 className="text-lg font-bold mb-4">Create New Floor Plan</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* From Listing */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-3">From Existing Listing</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {listings.length > 0 ? listings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => handleSelectListing(listing)}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    {listing.thumbnail ? (
                      <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{listing.title}</div>
                    <div className="text-xs text-white/40">{listing.photoCount} photos</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              )) : (
                <p className="text-white/40 text-sm p-4 text-center">No listings yet. Create one first or start fresh.</p>
              )}
            </div>
          </div>

          {/* Start Fresh */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-3">Start Fresh</h3>
            <button
              onClick={onUpload}
              className="w-full p-8 border-2 border-dashed border-white/20 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center"
            >
              <Plus className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <div className="font-medium">Create Without Listing</div>
              <div className="text-sm text-white/40 mt-1">Enter property details manually</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page
function FloorPlansContent() {
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleSelectListing = (listing: any, photos: string[]) => {
    setSelectedListing(listing);
    setPhotoUrls(photos);
    setShowGenerator(true);
  };

  const handleUpload = () => {
    setSelectedListing(null);
    setPhotoUrls([]);
    setShowGenerator(true);
  };

  const handleBack = () => {
    setShowGenerator(false);
    setSelectedListing(null);
    setPhotoUrls([]);
  };

  if (showGenerator) {
    return (
      <FloorPlanGenerator
        listingId={selectedListing?.id}
        listingTitle={selectedListing?.title}
        photoUrls={photoUrls}
        onBack={handleBack}
      />
    );
  }

  return (
    <ListingSelector
      onSelect={handleSelectListing}
      onUpload={handleUpload}
    />
  );
}

export default function FloorPlansPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <FloorPlansContent />
    </Suspense>
  );
}
