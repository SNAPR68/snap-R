'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, Home, ChevronRight, Upload, Sparkles, Download, 
  RotateCcw, Check, X, Image, Wand2, Paintbrush, Hammer,
  ChefHat, Bath, Bed, Sofa, UtensilsCrossed, Trees,
  ArrowRight, Lightbulb, Clock, DollarSign, Layers,
  Palette, Grid, CheckCircle, AlertCircle, Eye, History
} from 'lucide-react';
import Link from 'next/link';

// Import configuration (will be created)
const ROOM_TYPES = {
  kitchen: { id: 'kitchen', label: 'Kitchen', icon: ChefHat, renovationTypes: ['full-remodel', 'cabinets', 'counters', 'backsplash', 'flooring', 'appliances'] },
  bathroom: { id: 'bathroom', label: 'Bathroom', icon: Bath, renovationTypes: ['full-remodel', 'vanity', 'shower', 'flooring', 'fixtures'] },
  bedroom: { id: 'bedroom', label: 'Bedroom', icon: Bed, renovationTypes: ['flooring', 'paint', 'lighting'] },
  'living-room': { id: 'living-room', label: 'Living Room', icon: Sofa, renovationTypes: ['flooring', 'paint', 'fireplace', 'lighting'] },
  'dining-room': { id: 'dining-room', label: 'Dining Room', icon: UtensilsCrossed, renovationTypes: ['flooring', 'paint', 'lighting'] },
  exterior: { id: 'exterior', label: 'Exterior', icon: Home, renovationTypes: ['full-remodel', 'siding', 'roof', 'landscaping', 'paint'] },
};

const RENOVATION_TYPES: Record<string, { id: string; label: string; description: string; price: number; priceDisplay: string }> = {
  'full-remodel': { id: 'full-remodel', label: 'Full Remodel', description: 'Complete room transformation', price: 50, priceDisplay: '$50' },
  cabinets: { id: 'cabinets', label: 'Cabinet Replacement', description: 'New cabinet style and color', price: 25, priceDisplay: '$25' },
  counters: { id: 'counters', label: 'Countertop Change', description: 'New countertop material', price: 25, priceDisplay: '$25' },
  backsplash: { id: 'backsplash', label: 'Backsplash Update', description: 'New backsplash style', price: 15, priceDisplay: '$15' },
  flooring: { id: 'flooring', label: 'Flooring Change', description: 'New floor type and color', price: 25, priceDisplay: '$25' },
  paint: { id: 'paint', label: 'Paint Color', description: 'Change wall colors', price: 15, priceDisplay: '$15' },
  appliances: { id: 'appliances', label: 'Appliance Upgrade', description: 'Modern appliances', price: 15, priceDisplay: '$15' },
  vanity: { id: 'vanity', label: 'Vanity Replacement', description: 'New bathroom vanity', price: 25, priceDisplay: '$25' },
  shower: { id: 'shower', label: 'Shower Remodel', description: 'Modern shower design', price: 25, priceDisplay: '$25' },
  fixtures: { id: 'fixtures', label: 'Fixture Update', description: 'New faucets and hardware', price: 15, priceDisplay: '$15' },
  fireplace: { id: 'fireplace', label: 'Fireplace Remodel', description: 'Updated fireplace', price: 25, priceDisplay: '$25' },
  lighting: { id: 'lighting', label: 'Lighting Update', description: 'New light fixtures', price: 15, priceDisplay: '$15' },
  siding: { id: 'siding', label: 'Siding Change', description: 'New exterior siding', price: 25, priceDisplay: '$25' },
  roof: { id: 'roof', label: 'Roof Replacement', description: 'New roof style', price: 25, priceDisplay: '$25' },
  landscaping: { id: 'landscaping', label: 'Landscaping', description: 'Updated yard', price: 25, priceDisplay: '$25' },
};

const STYLES = [
  { id: 'modern', label: 'Modern', description: 'Clean lines, minimalist' },
  { id: 'traditional', label: 'Traditional', description: 'Classic, timeless' },
  { id: 'farmhouse', label: 'Farmhouse', description: 'Rustic, warm' },
  { id: 'contemporary', label: 'Contemporary', description: 'Current trends' },
  { id: 'scandinavian', label: 'Scandinavian', description: 'Light, airy' },
  { id: 'luxury', label: 'Luxury', description: 'High-end, premium' },
  { id: 'industrial', label: 'Industrial', description: 'Raw, urban' },
  { id: 'coastal', label: 'Coastal', description: 'Beach-inspired' },
  { id: 'transitional', label: 'Transitional', description: 'Traditional + Modern blend' },
  { id: 'mediterranean', label: 'Mediterranean', description: 'Warm, textured' },
];

const RENOVATION_OPTIONS = {
  cabinets: {
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'cream', label: 'Cream', hex: '#FFFDD0' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'navy', label: 'Navy Blue', hex: '#000080' },
      { id: 'sage', label: 'Sage Green', hex: '#9DC183' },
      { id: 'black', label: 'Black', hex: '#1a1a1a' },
      { id: 'natural-wood', label: 'Natural Wood', hex: '#DEB887' },
      { id: 'walnut', label: 'Dark Walnut', hex: '#5C4033' },
    ],
    styles: [
      { id: 'shaker', label: 'Shaker' },
      { id: 'flat-panel', label: 'Flat Panel / Slab' },
      { id: 'raised-panel', label: 'Raised Panel' },
      { id: 'glass-front', label: 'Glass Front' },
    ],
  },
  counters: {
    materials: [
      { id: 'quartz', label: 'Quartz' },
      { id: 'granite', label: 'Granite' },
      { id: 'marble', label: 'Marble' },
      { id: 'butcher-block', label: 'Butcher Block' },
      { id: 'concrete', label: 'Concrete' },
    ],
    colors: [
      { id: 'white', label: 'White', hex: '#FFFFFF' },
      { id: 'gray', label: 'Gray', hex: '#808080' },
      { id: 'black', label: 'Black', hex: '#1a1a1a' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'veined', label: 'White w/ Veins', hex: '#F0F0F0' },
    ],
  },
  flooring: {
    types: [
      { id: 'hardwood', label: 'Hardwood' },
      { id: 'laminate', label: 'Laminate' },
      { id: 'tile', label: 'Tile' },
      { id: 'vinyl-plank', label: 'Luxury Vinyl' },
      { id: 'carpet', label: 'Carpet' },
      { id: 'stone', label: 'Natural Stone' },
    ],
    colors: [
      { id: 'light-oak', label: 'Light Oak', hex: '#D4B896' },
      { id: 'medium-brown', label: 'Medium Brown', hex: '#8B4513' },
      { id: 'dark-walnut', label: 'Dark Walnut', hex: '#3D2314' },
      { id: 'gray-wash', label: 'Gray Wash', hex: '#9E9E9E' },
      { id: 'white-oak', label: 'White Oak', hex: '#E8DCC4' },
    ],
  },
  paint: {
    colors: [
      { id: 'white', label: 'Bright White', hex: '#FFFFFF' },
      { id: 'off-white', label: 'Off White', hex: '#FAF9F6' },
      { id: 'light-gray', label: 'Light Gray', hex: '#D3D3D3' },
      { id: 'warm-gray', label: 'Warm Gray', hex: '#A8A29E' },
      { id: 'navy', label: 'Navy Blue', hex: '#1e3a5f' },
      { id: 'sage', label: 'Sage Green', hex: '#9DC183' },
      { id: 'beige', label: 'Beige', hex: '#F5F5DC' },
      { id: 'charcoal', label: 'Charcoal', hex: '#36454F' },
    ],
  },
};

// FIXED: Download helper function with better CORS handling
async function downloadImage(url: string, filename: string): Promise<boolean> {
  try {
    // Method 1: Try direct fetch (works for same-origin or CORS-enabled URLs)
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);
      
      return true;
    }
  } catch (err) {
    console.log('Direct fetch failed, trying canvas method...');
  }

  // Method 2: Use canvas to download (works for images that can be displayed)
  try {
    return await downloadViaCanvas(url, filename);
  } catch (err) {
    console.log('Canvas method failed, trying link method...');
  }

  // Method 3: Create link with download attribute (may open in new tab on some browsers)
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('All download methods failed:', err);
    // Last resort: open in new tab
    window.open(url, '_blank');
    return false;
  }
}

// Helper: Download image via canvas (bypasses some CORS issues)
function downloadViaCanvas(url: string, filename: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'));
            return;
          }
          
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
          }, 100);
          
          resolve(true);
        }, 'image/png', 1.0);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Image failed to load'));
    };
    
    // Add timestamp to bypass cache
    img.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
  });
}

// Main Renovation Interface
function RenovationInterface({
  imageUrl,
  listingId,
  onBack,
}: {
  imageUrl: string;
  listingId?: string;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState<string>('');
  const [renovationType, setRenovationType] = useState<string>('');
  const [style, setStyle] = useState<string>('modern');
  const [options, setOptions] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; processingTime: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const selectedRoom = ROOM_TYPES[roomType as keyof typeof ROOM_TYPES];
  const selectedRenovation = RENOVATION_TYPES[renovationType];
  const availableOptions = RENOVATION_OPTIONS[renovationType as keyof typeof RENOVATION_OPTIONS];

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          roomType,
          renovationType,
          style,
          options,
          listingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setResult({
        url: data.resultUrl,
        processingTime: data.processingTime || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setRoomType('');
    setRenovationType('');
    setStyle('modern');
    setOptions({});
    setResult(null);
    setError(null);
    setDownloadSuccess(false);
  };

  const handleDownload = async () => {
    if (!result?.url) return;
    setDownloading(true);
    setDownloadSuccess(false);
    
    const success = await downloadImage(result.url, `renovation-${roomType}-${renovationType}-${Date.now()}.png`);
    
    setDownloading(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  // Result View
  if (result) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Renovation Complete!</h1>
                <p className="text-white/50">
                  {selectedRoom?.label} • {selectedRenovation?.label} • {STYLES.find(s => s.id === style)?.label}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New Renovation
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  downloadSuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadSuccess ? 'Downloaded!' : 'Download'}
              </button>
            </div>
          </div>

          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10 text-center">
                <span className="text-sm font-medium text-white/60">BEFORE</span>
              </div>
              <img src={imageUrl} alt="Before" className="w-full aspect-[4/3] object-cover" />
            </div>
            <div className="bg-white/5 rounded-2xl overflow-hidden border-2 border-amber-500/30">
              <div className="p-3 border-b border-amber-500/30 text-center bg-amber-500/10">
                <span className="text-sm font-medium text-amber-400">AFTER</span>
              </div>
              <img src={result.url} alt="After" className="w-full aspect-[4/3] object-cover" />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              Choose Different Photo
            </button>
            <Link
              href={listingId ? `/dashboard/content-studio/create-all?listing=${listingId}` : '/dashboard/content-studio'}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-5 h-5" />
              Create Marketing Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step-by-step wizard
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Virtual Renovation</h1>
              <p className="text-white/50">Transform your space with AI</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step === s
                    ? 'bg-amber-500 text-black'
                    : step > s
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Preview */}
          <div className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 text-center">
              <span className="text-sm font-medium text-white/60">ORIGINAL PHOTO</span>
            </div>
            <img src={imageUrl} alt="Original" className="w-full aspect-[4/3] object-cover" />
          </div>

          {/* Right: Controls */}
          <div className="space-y-6">
            {/* Step 1: Room Type */}
            {step === 1 && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-amber-400" />
                  Select Room Type
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(ROOM_TYPES).map((room) => {
                    const Icon = room.icon;
                    return (
                      <button
                        key={room.id}
                        onClick={() => {
                          setRoomType(room.id);
                          setStep(2);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left hover:border-amber-500/50 ${
                          roomType === room.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-6 h-6 text-amber-400 mb-2" />
                        <span className="font-medium">{room.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Renovation Type */}
            {step === 2 && selectedRoom && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-amber-400" />
                    Select Renovation Type
                  </h2>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-white/50 hover:text-white"
                  >
                    Back
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedRoom.renovationTypes.map((type) => {
                    const reno = RENOVATION_TYPES[type];
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setRenovationType(type);
                          setStep(3);
                        }}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:border-amber-500/50 ${
                          renovationType === type
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{reno.label}</span>
                            <p className="text-sm text-white/50">{reno.description}</p>
                          </div>
                          <span className="text-amber-400 font-bold">{reno.priceDisplay}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Style & Options */}
            {step === 3 && selectedRenovation && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Palette className="w-5 h-5 text-amber-400" />
                      Select Style
                    </h2>
                    <button
                      onClick={() => setStep(2)}
                      className="text-sm text-white/50 hover:text-white"
                    >
                      Back
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          style === s.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span className="font-medium text-sm">{s.label}</span>
                        <p className="text-xs text-white/40">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60">Selected:</span>
                    <span className="font-bold">{selectedRenovation.label}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60">Style:</span>
                    <span className="font-bold">{STYLES.find(s => s.id === style)?.label}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4 flex items-center justify-between">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-amber-400">{selectedRenovation.priceDisplay}</span>
                  </div>
                </div>

                {/* Process Button */}
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processing... (30-60 seconds)
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6" />
                      Generate Renovation
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Photo Selection Page
function PhotoSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadListings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: listingsData } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            address,
            photos:listing_photos(id, url, enhanced_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setListings(listingsData || []);

        // Check for pre-selected listing
        const listingId = searchParams.get('listing');
        if (listingId && listingsData) {
          const listing = listingsData.find(l => l.id === listingId);
          if (listing) setSelectedListing(listing);
        }
      } catch (err) {
        console.error('Error loading listings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadListings();
  }, [supabase, router, searchParams]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setSelectedPhoto(null);
        setSelectedListing(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // If photo is selected, show renovation interface
  if (selectedPhoto || uploadedImage) {
    return (
      <RenovationInterface
        imageUrl={selectedPhoto || uploadedImage!}
        listingId={selectedListing?.id}
        onBack={() => {
          setSelectedPhoto(null);
          setUploadedImage(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Virtual Renovation</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Virtual Renovation</h1>
          <p className="text-white/60">
            Transform any room with AI-powered virtual staging and renovation
          </p>
        </div>

        {/* Pricing Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-amber-400 mb-1">Pay Per Renovation</h2>
              <p className="text-white/60">High-quality AI renovations at transparent prices</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">$15</span>
                <span className="text-white/50">- $50</span>
              </div>
              <p className="text-sm text-white/50">per renovation</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload New Photo */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              Upload Photo
            </h2>
            <label className="block">
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-amber-500" />
                ) : (
                  <Upload className="w-10 h-10 mx-auto mb-3 text-white/30" />
                )}
                <p className="text-white/50">Click to upload a photo</p>
                <p className="text-xs text-white/30 mt-1">JPG, PNG, WebP accepted</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Select from Listings */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-400" />
              From Your Listings
            </h2>
            {listings.length === 0 ? (
              <p className="text-white/50 text-center py-8">
                No listings yet. Upload a photo or create a listing first.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {listings.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => setSelectedListing(listing)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedListing?.id === listing.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {listing.photos?.[0] ? (
                      <img
                        src={listing.photos[0].enhanced_url || listing.photos[0].url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                        <Image className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{listing.title || listing.address}</p>
                      <p className="text-sm text-white/50">{listing.photos?.length || 0} photos</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Photo Grid for Selected Listing */}
        {selectedListing && selectedListing.photos?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Select a photo from {selectedListing.title || selectedListing.address}</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedListing.photos.map((photo: any) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo.enhanced_url || photo.url)}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-white/10 hover:border-amber-500/50 transition-all"
                >
                  <img
                    src={photo.enhanced_url || photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RenovationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <PhotoSelection />
    </Suspense>
  );
}
