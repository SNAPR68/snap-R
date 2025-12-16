'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Home, ChevronRight, Upload, Sparkles, Download,
  Check, X, Image, Grid, Layers, Eye, Clock, DollarSign,
  FileText, Printer, Share2, Lightbulb, Building, Bed, Bath,
  Square, Maximize2, Settings, Star, Zap, ArrowRight, Plus,
  LayoutGrid, Box, MousePointer
} from 'lucide-react';

// Plan Types Configuration
const PLAN_TYPES = {
  '2d-basic': {
    id: '2d-basic',
    label: '2D Basic',
    description: 'Clean black & white floor plan',
    price: 20,
    credits: 4,
    turnaround: '24 hours',
    icon: LayoutGrid,
    features: ['Room labels', 'Dimensions', 'Total sqft', 'PNG & PDF'],
    popular: false,
  },
  '2d-branded': {
    id: '2d-branded',
    label: '2D Branded',
    description: 'Colored with your logo',
    price: 35,
    credits: 6,
    turnaround: '24-48 hours',
    icon: Grid,
    features: ['Everything in Basic', 'Your logo', 'Brand colors', 'High-res'],
    popular: true,
  },
  '3d-isometric': {
    id: '3d-isometric',
    label: '3D Isometric',
    description: '3D dollhouse view',
    price: 50,
    credits: 8,
    turnaround: '48 hours',
    icon: Box,
    features: ['3D visualization', 'Furniture', 'Multiple angles'],
    popular: false,
  },
  'interactive': {
    id: 'interactive',
    label: 'Interactive',
    description: 'Clickable room photos',
    price: 75,
    credits: 12,
    turnaround: '48-72 hours',
    icon: MousePointer,
    features: ['Clickable rooms', 'Photo links', 'Embed anywhere'],
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
  { id: 'color', label: 'Full Color', hex: '#4CAF50' },
  { id: 'grayscale', label: 'Grayscale', hex: '#9E9E9E' },
  { id: 'blueprint', label: 'Blueprint', hex: '#2196F3' },
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
  listing_id?: string;
}

// Plan Type Card Component
function PlanTypeCard({
  type,
  selected,
  onClick,
}: {
  type: PlanTypeValue;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = type.icon;
  
  return (
    <button
      onClick={onClick}
      className={`relative p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
        selected
          ? 'bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500'
          : 'bg-white/5 border-white/10 hover:border-white/30'
      }`}
    >
      {type.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" /> POPULAR
        </div>
      )}
      
      <Icon className={`w-10 h-10 mb-4 ${selected ? 'text-amber-400' : 'text-white/50'}`} />
      
      <h3 className="text-lg font-bold mb-1">{type.label}</h3>
      <p className="text-sm text-white/50 mb-4">{type.description}</p>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold text-amber-400">${type.price}</span>
        <span className="text-sm text-white/40">{type.turnaround}</span>
      </div>
      
      <ul className="space-y-2">
        {type.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-white/60">
            <Check className="w-4 h-4 text-green-400" />
            {feature}
          </li>
        ))}
      </ul>
    </button>
  );
}

// Floor Plan Generator Interface
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
  const [options, setOptions] = useState({
    showDimensions: true,
    showFurniture: false,
    showRoomNames: true,
    showSqft: true,
    includeBranding: false,
  });
  const [propertyDetails, setPropertyDetails] = useState({
    sqft: '',
    bedrooms: '',
    bathrooms: '',
    floors: '1',
  });
  const [rushOrder, setRushOrder] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = PLAN_TYPES[planType as PlanTypeKey];
  const totalPrice = selectedPlan.price + (rushOrder ? Math.round(selectedPlan.price * 0.5) : 0);

  const handleGenerate = async () => {
    setProcessing(true);
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
            bedrooms: propertyDetails.bedrooms ? parseInt(propertyDetails.bedrooms) : undefined,
            bathrooms: propertyDetails.bathrooms ? parseFloat(propertyDetails.bathrooms) : undefined,
            floors: parseInt(propertyDetails.floors) || 1,
          },
          options,
          rushOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate floor plan');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Result view
  if (result) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {result.imageUrl ? 'Floor Plan Ready!' : 'Order Placed!'}
                </h1>
                <p className="text-white/50">{selectedPlan.label}</p>
              </div>
            </div>
          </div>

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

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Create Another
            </button>
            {result.imageUrl && (
              <a
                href={result.imageUrl}
                download="floor-plan.png"
                className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold text-center hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </a>
            )}
          </div>
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
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            ← Back
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 rounded ${step > s ? 'bg-blue-500' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Choose Plan Type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Step 1: Choose Plan Type</h2>
            <p className="text-white/50 mb-6">Select the type of floor plan you need</p>
            
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

        {/* Step 2: Property Details */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Step 2: Property Details</h2>
                <p className="text-white/50">Enter property information (optional but recommended)</p>
              </div>
              <button onClick={() => setStep(1)} className="text-blue-400 hover:underline text-sm">
                Change plan type
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Property Info */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4">Property Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Total Square Feet</label>
                    <div className="relative">
                      <Square className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="number"
                        value={propertyDetails.sqft}
                        onChange={(e) => setPropertyDetails({ ...propertyDetails, sqft: e.target.value })}
                        placeholder="2,500"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Bedrooms</label>
                      <div className="relative">
                        <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="number"
                          value={propertyDetails.bedrooms}
                          onChange={(e) => setPropertyDetails({ ...propertyDetails, bedrooms: e.target.value })}
                          placeholder="3"
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Bathrooms</label>
                      <div className="relative">
                        <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="number"
                          step="0.5"
                          value={propertyDetails.bathrooms}
                          onChange={(e) => setPropertyDetails({ ...propertyDetails, bathrooms: e.target.value })}
                          placeholder="2"
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Number of Floors</label>
                    <select
                      value={propertyDetails.floors}
                      onChange={(e) => setPropertyDetails({ ...propertyDetails, floors: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="1">1 Floor</option>
                      <option value="2">2 Floors</option>
                      <option value="3">3 Floors</option>
                      <option value="4">4+ Floors</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Style Options */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4">Style Options</h3>
                
                <div className="mb-4">
                  <label className="block text-sm text-white/60 mb-2">Floor Plan Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`p-3 rounded-lg text-sm text-left transition-all ${
                          style === s.id
                            ? 'bg-blue-500/20 border border-blue-500/50'
                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium">{s.label}</div>
                        <div className="text-xs text-white/40">{s.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-white/60 mb-2">Color Scheme</label>
                  <div className="flex gap-2">
                    {COLOR_SCHEMES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setColorScheme(c.id)}
                        className={`flex-1 p-3 rounded-lg text-sm text-center transition-all ${
                          colorScheme === c.id
                            ? 'bg-blue-500/20 border border-blue-500/50'
                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.showDimensions}
                      onChange={(e) => setOptions({ ...options, showDimensions: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Show room dimensions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.showFurniture}
                      onChange={(e) => setOptions({ ...options, showFurniture: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Include furniture layout</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.showSqft}
                      onChange={(e) => setOptions({ ...options, showSqft: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">Show square footage per room</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-colors"
            >
              Continue to Review
            </button>
          </div>
        )}

        {/* Step 3: Review & Order */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Step 3: Review & Order</h2>
                <p className="text-white/50">Confirm your floor plan order</p>
              </div>
              <button onClick={() => setStep(2)} className="text-blue-400 hover:underline text-sm">
                Edit details
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="font-bold mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Plan Type</span>
                  <span className="font-medium">{selectedPlan.label}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Style</span>
                  <span className="font-medium">{STYLES.find(s => s.id === style)?.label}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Color Scheme</span>
                  <span className="font-medium">{COLOR_SCHEMES.find(c => c.id === colorScheme)?.label}</span>
                </div>
                {propertyDetails.sqft && (
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Square Feet</span>
                    <span className="font-medium">{propertyDetails.sqft} sqft</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/60">Estimated Delivery</span>
                  <span className="font-medium">{selectedPlan.turnaround}</span>
                </div>
              </div>
            </div>

            {/* Rush Order Option */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <div>
                    <div className="font-medium">Rush Order</div>
                    <div className="text-sm text-white/50">Get it 50% faster (+${Math.round(selectedPlan.price * 0.5)})</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={rushOrder}
                  onChange={(e) => setRushOrder(e.target.checked)}
                  className="w-6 h-6 rounded border-amber-500/50 bg-amber-500/10 text-amber-500 focus:ring-amber-500"
                />
              </label>
            </div>

            {/* Price */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg">Total Price</span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-blue-400">${totalPrice}</span>
                  <div className="text-sm text-white/40">{selectedPlan.credits} credits</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-400 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
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
  );
}

// Listing Selector
function ListingSelector({ onSelect, onUpload }: { onSelect: (listing: any, photos: string[]) => void; onUpload: () => void }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingPlans, setExistingPlans] = useState<FloorPlan[]>([]);

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
      .select('*, photos(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingsData) {
      const withThumbnails = await Promise.all(
        listingsData.map(async (listing: any) => {
          const photos = listing.photos || [];
          const firstPhoto = photos[0];
          let thumbnail = null;
          if (firstPhoto) {
            const path = firstPhoto.processed_url || firstPhoto.raw_url;
            if (path && !path.startsWith('http')) {
              const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
              thumbnail = data?.signedUrl;
            }
          }
          return { id: listing.id, title: listing.title, address: listing.address, thumbnail, photoCount: photos.length };
        })
      );
      setListings(withThumbnails);
    }

    // Load existing floor plans
    const { data: plansData } = await supabase
      .from('floor_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

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
            <p className="text-white/50">Professional 2D & 3D floor plans for your listings</p>
          </div>
        </div>

        {/* What this does */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-1">Why floor plans matter</h3>
              <p className="text-sm text-white/70">
                Listings with floor plans receive 52% more inquiries. Help buyers understand the layout 
                and flow of the property. We offer 2D, 3D, and interactive floor plans starting at just $20.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.values(PLAN_TYPES).map((type) => (
            <div key={type.id} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <type.icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="font-medium">{type.label}</div>
              <div className="text-2xl font-bold text-blue-400">${type.price}</div>
              <div className="text-xs text-white/40">{type.turnaround}</div>
            </div>
          ))}
        </div>

        {/* Existing Floor Plans */}
        {existingPlans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Your Floor Plans</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {existingPlans.map((plan) => (
                <div key={plan.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {plan.image_url ? (
                    <img src={plan.image_url} alt={plan.name} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-medium truncate">{plan.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-white/50">
                        {PLAN_TYPES[plan.plan_type as PlanTypeKey]?.label}
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

        {/* Select Listing or Upload */}
        <h2 className="text-lg font-bold mb-4">Create New Floor Plan</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* From Listing */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-3">From Existing Listing</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {listings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => handleSelectListing(listing)}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-12 h-8 rounded overflow-hidden bg-white/10">
                    {listing.thumbnail ? (
                      <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{listing.title || 'Untitled'}</div>
                    <div className="text-xs text-white/40">{listing.photoCount} photos</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </button>
              ))}
            </div>
          </div>

          {/* Upload / New */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-medium mb-3">Start Fresh</h3>
            <button
              onClick={onUpload}
              className="w-full p-6 border-2 border-dashed border-white/20 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center"
            >
              <Plus className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <div className="font-medium">Create Without Listing</div>
              <div className="text-sm text-white/40 mt-1">Enter details manually</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
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
