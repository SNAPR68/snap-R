'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Sofa, Bed, UtensilsCrossed, Briefcase, Baby, Crown,
  Plus, Minus, RefreshCw, Download, ChevronRight, Home, ArrowLeft,
  Sparkles, Check, Star, Zap, Image as ImageIcon, X, RotateCcw
} from 'lucide-react';

// Furniture Styles
const FURNITURE_STYLES = {
  modern: {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, minimalist',
    preview: '🪑',
    colors: ['#FFFFFF', '#808080', '#000000', '#1a365d'],
  },
  scandinavian: {
    id: 'scandinavian',
    label: 'Scandinavian',
    description: 'Light, airy, Nordic',
    preview: '🌿',
    colors: ['#FFFFFF', '#E5E5E5', '#B8D4E3', '#DEB887'],
  },
  farmhouse: {
    id: 'farmhouse',
    label: 'Farmhouse',
    description: 'Rustic, warm charm',
    preview: '🏡',
    colors: ['#FFFFFF', '#FFFDD0', '#9DC183', '#000080'],
  },
  luxury: {
    id: 'luxury',
    label: 'Luxury',
    description: 'High-end, opulent',
    preview: '✨',
    colors: ['#FFFFFF', '#FFD700', '#F5F5F5', '#000000'],
  },
  coastal: {
    id: 'coastal',
    label: 'Coastal',
    description: 'Beach-inspired, relaxed',
    preview: '🌊',
    colors: ['#FFFFFF', '#4169E1', '#C2B280', '#20B2AA'],
  },
  industrial: {
    id: 'industrial',
    label: 'Industrial',
    description: 'Urban loft, raw',
    preview: '🏭',
    colors: ['#808080', '#000000', '#8B4513', '#696969'],
  },
  midcentury: {
    id: 'midcentury',
    label: 'Mid-Century',
    description: 'Retro 1950s-60s',
    preview: '🕰️',
    colors: ['#DAA520', '#008080', '#FF8C00', '#8B4513'],
  },
  traditional: {
    id: 'traditional',
    label: 'Traditional',
    description: 'Classic, timeless',
    preview: '🏛️',
    colors: ['#800020', '#000080', '#FFD700', '#FFFDD0'],
  },
  bohemian: {
    id: 'bohemian',
    label: 'Bohemian',
    description: 'Eclectic, colorful',
    preview: '🎨',
    colors: ['#E2725B', '#DAA520', '#008080', '#C71585'],
  },
  transitional: {
    id: 'transitional',
    label: 'Transitional',
    description: 'Modern + Traditional',
    preview: '⚖️',
    colors: ['#808080', '#B38B6D', '#FFFDD0', '#000080'],
  },
};

const ROOM_TYPES = {
  'living-room': { id: 'living-room', label: 'Living Room', icon: Sofa },
  'bedroom': { id: 'bedroom', label: 'Bedroom', icon: Bed },
  'dining-room': { id: 'dining-room', label: 'Dining Room', icon: UtensilsCrossed },
  'office': { id: 'office', label: 'Home Office', icon: Briefcase },
  'kids-room': { id: 'kids-room', label: 'Kids Room', icon: Baby },
  'master-suite': { id: 'master-suite', label: 'Master Suite', icon: Crown },
};

const QUALITY_TIERS = {
  quick: {
    id: 'quick',
    label: 'AI Quick',
    price: 8,
    credits: 3,
    time: '~30s',
    features: ['Instant results', 'Good quality'],
  },
  standard: {
    id: 'standard',
    label: 'AI Standard',
    price: 15,
    credits: 5,
    time: '~45s',
    features: ['Better placement', 'Higher quality'],
    popular: true,
  },
  premium: {
    id: 'premium',
    label: 'AI Premium',
    price: 25,
    credits: 8,
    time: '~60s',
    features: ['Photorealistic', 'Magazine quality'],
  },
};

const PRESETS = {
  'vacant-to-staged': { id: 'vacant-to-staged', label: 'Add Furniture', icon: Plus, description: 'Stage empty room' },
  'occupied-to-vacant': { id: 'occupied-to-vacant', label: 'Remove Furniture', icon: Minus, description: 'Clear the room' },
  'style-change': { id: 'style-change', label: 'Change Style', icon: RefreshCw, description: 'Replace furniture' },
};

interface Listing {
  id: string;
  title: string;
  address?: string;
  thumbnail?: string | null;
  photoCount: number;
}

interface Photo {
  id: string;
  url: string;
  name?: string;
}

// Style Card Component
function StyleCard({ 
  style, 
  selected, 
  onClick 
}: { 
  style: typeof FURNITURE_STYLES[keyof typeof FURNITURE_STYLES]; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
        selected
          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50 ring-2 ring-amber-500'
          : 'bg-white/5 border-white/10 hover:border-white/30'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{style.preview}</span>
        <div>
          <h3 className="font-bold">{style.label}</h3>
          <p className="text-xs text-white/50">{style.description}</p>
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        {style.colors.map((color, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full border border-white/20"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {selected && (
        <div className="absolute top-2 right-2">
          <Check className="w-5 h-5 text-amber-400" />
        </div>
      )}
    </button>
  );
}

// Main Staging Component
function VirtualStagingStudio({
  listingId,
  listingTitle,
  photos,
  onBack,
}: {
  listingId?: string;
  listingTitle?: string;
  photos: Photo[];
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(photos[0] || null);
  const [roomType, setRoomType] = useState('living-room');
  const [furnitureStyle, setFurnitureStyle] = useState('modern');
  const [qualityTier, setQualityTier] = useState('standard');
  const [preset, setPreset] = useState('vacant-to-staged');
  const [customInstructions, setCustomInstructions] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);

  const selectedQuality = QUALITY_TIERS[qualityTier as keyof typeof QUALITY_TIERS];

  const handleStage = async (isRegenerate = false) => {
    if (!selectedPhoto) return;
    
    if (isRegenerate) {
      setRegenerating(true);
    } else {
      setProcessing(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: selectedPhoto.id,
          imageUrl: selectedPhoto.url,
          listingId,
          roomType,
          furnitureStyle,
          qualityTier,
          preset,
          customInstructions: customInstructions || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Staging failed');
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

  // Result View
  if (result?.success && result?.stagedUrl) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Staging Complete!</h1>
                <p className="text-white/50">
                  {FURNITURE_STYLES[furnitureStyle as keyof typeof FURNITURE_STYLES]?.label} • 
                  {ROOM_TYPES[roomType as keyof typeof ROOM_TYPES]?.label} • 
                  Generation #{generationCount}
                </p>
              </div>
            </div>
          </div>

          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 rounded-full text-sm font-medium">
                Before
              </div>
              <img
                src={selectedPhoto?.url}
                alt="Before"
                className="w-full rounded-xl border border-white/10"
              />
            </div>
            <div className="relative">
              <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-black rounded-full text-sm font-bold">
                After
              </div>
              <img
                src={result.stagedUrl}
                alt="After"
                className="w-full rounded-xl border border-amber-500/30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Stage Another Photo
            </button>
            
            <button
              onClick={() => handleStage(true)}
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
                  <RotateCcw className="w-5 h-5" />
                  Regenerate
                </>
              )}
            </button>
            
            <a
              href={result.stagedUrl}
              download={`staged-${furnitureStyle}-${Date.now()}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold text-center hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </a>
          </div>

          {/* Try Different Style */}
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="font-medium mb-3">Try a Different Style</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(FURNITURE_STYLES).filter(s => s.id !== furnitureStyle).slice(0, 5).map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setFurnitureStyle(style.id);
                    setResult(null);
                  }}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                >
                  <span>{style.preview}</span>
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
              <Sofa className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Virtual Staging Studio</h1>
              <p className="text-white/50">{listingTitle || 'Stage your photos'}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-white/50 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { num: 1, label: 'Select Photo' },
            { num: 2, label: 'Room & Style' },
            { num: 3, label: 'Generate' },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => step > s.num && setStep(s.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step >= s.num ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/40'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-sm font-bold">
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </span>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </button>
              {i < 2 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-amber-500' : 'bg-white/10'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Step 1: Select Photo */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Select a Photo to Stage</h2>
            <p className="text-white/50 mb-6">Choose an empty room photo for best results</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                    selectedPhoto?.id === photo.id
                      ? 'border-amber-500 ring-2 ring-amber-500/50'
                      : 'border-transparent hover:border-white/30'
                  }`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  {selectedPhoto?.id === photo.id && (
                    <div className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {photos.length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-xl">
                <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No photos available. Upload photos first.</p>
              </div>
            )}
            
            <button
              onClick={() => setStep(2)}
              disabled={!selectedPhoto}
              className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Room Type & Furniture Style */}
        {step === 2 && (
          <div>
            {/* Selected Photo Preview */}
            <div className="flex gap-6 mb-8">
              <div className="w-64 flex-shrink-0">
                <img 
                  src={selectedPhoto?.url} 
                  alt="" 
                  className="w-full rounded-xl border border-white/10"
                />
                <button 
                  onClick={() => setStep(1)}
                  className="w-full mt-2 text-sm text-white/50 hover:text-white"
                >
                  Change photo
                </button>
              </div>
              
              <div className="flex-1">
                {/* Room Type */}
                <h3 className="text-lg font-bold mb-3">What room is this?</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {Object.values(ROOM_TYPES).map((room) => {
                    const Icon = room.icon;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setRoomType(room.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          roomType === room.id
                            ? 'bg-amber-500/20 border-amber-500'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${roomType === room.id ? 'text-amber-400' : 'text-white/50'}`} />
                        <div className="font-medium text-sm">{room.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Preset */}
                <h3 className="text-lg font-bold mb-3">What do you want to do?</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {Object.values(PRESETS).map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPreset(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          preset === p.id
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${preset === p.id ? 'text-purple-400' : 'text-white/50'}`} />
                        <div className="font-medium text-sm">{p.label}</div>
                        <div className="text-xs text-white/40">{p.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Furniture Styles */}
            {preset !== 'occupied-to-vacant' && (
              <>
                <h3 className="text-lg font-bold mb-3">Choose Furniture Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {Object.values(FURNITURE_STYLES).map((style) => (
                    <StyleCard
                      key={style.id}
                      style={style}
                      selected={furnitureStyle === style.id}
                      onClick={() => setFurnitureStyle(style.id)}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quality & Generate */}
        {step === 3 && (
          <div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Preview & Options */}
              <div>
                <div className="mb-6">
                  <img 
                    src={selectedPhoto?.url} 
                    alt="" 
                    className="w-full rounded-xl border border-white/10"
                  />
                </div>

                {/* Custom Instructions */}
                <div className="mb-6">
                  <label className="text-sm text-white/60 mb-2 block">
                    Custom Instructions (optional)
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Add a large sectional sofa, include a TV on the wall, warm cozy lighting..."
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 h-24 resize-none"
                  />
                </div>
              </div>

              {/* Right: Quality Tiers & Summary */}
              <div>
                {/* Quality Tiers */}
                <h3 className="text-lg font-bold mb-3">Select Quality</h3>
                <div className="space-y-3 mb-6">
                  {Object.values(QUALITY_TIERS).map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setQualityTier(tier.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        qualityTier === tier.id
                          ? 'bg-amber-500/20 border-amber-500'
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{tier.label}</span>
                          {('popular' in tier) && ('popular' in tier) && tier.popular && (
                            <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <span className="text-xl font-bold text-amber-400">${tier.price}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {tier.time}
                        </span>
                        <span>{tier.features.join(' • ')}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="font-bold mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Room Type</span>
                      <span>{ROOM_TYPES[roomType as keyof typeof ROOM_TYPES]?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Style</span>
                      <span className="flex items-center gap-2">
                        {FURNITURE_STYLES[furnitureStyle as keyof typeof FURNITURE_STYLES]?.preview}
                        {FURNITURE_STYLES[furnitureStyle as keyof typeof FURNITURE_STYLES]?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Action</span>
                      <span>{PRESETS[preset as keyof typeof PRESETS]?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Quality</span>
                      <span>{selectedQuality.label}</span>
                    </div>
                    <hr className="border-white/10 my-2" />
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-amber-400">${selectedQuality.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-white/10 rounded-xl font-medium hover:bg-white/20"
              >
                Back
              </button>
              <button
                onClick={() => handleStage(false)}
                disabled={processing}
                className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Staging... {selectedQuality.time}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Staging
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

// Listing/Photo Selector
function ListingSelector({
  onSelect,
}: {
  onSelect: (listing: any, photos: Photo[]) => void;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    setLoading(false);
  };

  const handleSelectListing = async (listing: Listing) => {
    const supabase = createClient();
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: true });

    const photoList = await Promise.all(
      (photos || []).map(async (photo) => {
        const path = photo.processed_url || photo.raw_url;
        const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
        return {
          id: photo.id,
          url: data?.signedUrl || '',
          name: photo.original_filename,
        };
      })
    );

    onSelect(listing, photoList.filter(p => p.url));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
            <Sofa className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Virtual Staging</h1>
            <p className="text-white/50">Transform empty rooms into beautifully staged spaces</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🪑', label: '10 Furniture Styles', desc: 'Modern to Bohemian' },
            { icon: '⚡', label: '30-60 Seconds', desc: 'Instant results' },
            { icon: '✨', label: 'Photorealistic', desc: 'Magazine quality' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <div className="font-medium">{feature.label}</div>
              <div className="text-xs text-white/50">{feature.desc}</div>
            </div>
          ))}
        </div>

        {/* Select Listing */}
        <h2 className="text-lg font-bold mb-4">Select a Listing</h2>
        <div className="space-y-3">
          {listings.length > 0 ? listings.map(listing => (
            <button
              key={listing.id}
              onClick={() => handleSelectListing(listing)}
              className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-left"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                {listing.thumbnail ? (
                  <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-6 h-6 text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{listing.title}</div>
                <div className="text-sm text-white/40">{listing.photoCount} photos</div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>
          )) : (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <Home className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No listings yet. Create one first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Page
function VirtualStagingContent() {
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showStudio, setShowStudio] = useState(false);

  const handleSelectListing = (listing: any, photoList: Photo[]) => {
    setSelectedListing(listing);
    setPhotos(photoList);
    setShowStudio(true);
  };

  const handleBack = () => {
    setShowStudio(false);
    setSelectedListing(null);
    setPhotos([]);
  };

  if (showStudio) {
    return (
      <VirtualStagingStudio
        listingId={selectedListing?.id}
        listingTitle={selectedListing?.title}
        photos={photos}
        onBack={handleBack}
      />
    );
  }

  return <ListingSelector onSelect={handleSelectListing} />;
}

export default function VirtualStagingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    }>
      <VirtualStagingContent />
    </Suspense>
  );
}
