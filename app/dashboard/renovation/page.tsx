'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Paintbrush, Home, ChefHat, Bath, Flame, Upload,
  ArrowLeft, Loader2, Download, RefreshCw, Sparkles,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight,
  Building, MapPin
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================
interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  photos?: { signedProcessedUrl?: string; signedOriginalUrl?: string; processed_url?: string; raw_url?: string }[];
}

// ============================================
// RENOVATION CONFIG
// ============================================
const RENOVATION_TYPES = {
  interior: [
    { id: 'paint', name: 'Wall Paint', icon: Paintbrush },
    { id: 'flooring', name: 'Flooring', icon: Home },
    { id: 'cabinets', name: 'Cabinets', icon: ChefHat },
    { id: 'counters', name: 'Countertops', icon: ChefHat },
    { id: 'backsplash', name: 'Backsplash', icon: ChefHat },
    { id: 'vanity', name: 'Bathroom Vanity', icon: Bath },
    { id: 'shower', name: 'Shower/Tub', icon: Bath },
    { id: 'fireplace', name: 'Fireplace', icon: Flame },
  ],
  exterior: [
    { id: 'siding', name: 'House Siding', icon: Home, warning: true },
    { id: 'roof', name: 'Roof', icon: Home, warning: true },
    { id: 'landscaping', name: 'Landscaping', icon: Home },
  ],
};

const RENOVATION_OPTIONS: Record<string, { label: string; options: { value: string; label: string }[] }[]> = {
  paint: [{ label: 'Color', options: [
    { value: 'warm white', label: 'Warm White' }, { value: 'cool gray', label: 'Cool Gray' },
    { value: 'warm gray', label: 'Warm Gray' }, { value: 'navy blue', label: 'Navy Blue' },
    { value: 'sage green', label: 'Sage Green' }, { value: 'beige', label: 'Beige' }, { value: 'charcoal', label: 'Charcoal' },
  ]}],
  flooring: [
    { label: 'Type', options: [
      { value: 'hardwood', label: 'Hardwood' }, { value: 'laminate', label: 'Laminate' },
      { value: 'tile', label: 'Tile' }, { value: 'vinyl plank', label: 'Vinyl Plank' }, { value: 'carpet', label: 'Carpet' },
    ]},
    { label: 'Color', options: [
      { value: 'light oak', label: 'Light Oak' }, { value: 'natural oak', label: 'Natural Oak' },
      { value: 'dark walnut', label: 'Dark Walnut' }, { value: 'espresso', label: 'Espresso' },
      { value: 'gray wash', label: 'Gray Wash' }, { value: 'white oak', label: 'White Oak' },
    ]},
  ],
  cabinets: [
    { label: 'Style', options: [
      { value: 'shaker', label: 'Shaker' }, { value: 'flat panel', label: 'Flat Panel' },
      { value: 'raised panel', label: 'Raised Panel' }, { value: 'glass front', label: 'Glass Front' },
    ]},
    { label: 'Color', options: [
      { value: 'white', label: 'White' }, { value: 'navy blue', label: 'Navy Blue' },
      { value: 'sage green', label: 'Sage Green' }, { value: 'natural wood', label: 'Natural Wood' },
      { value: 'espresso', label: 'Espresso' }, { value: 'gray', label: 'Gray' },
    ]},
  ],
  counters: [
    { label: 'Material', options: [
      { value: 'quartz', label: 'Quartz' }, { value: 'granite', label: 'Granite' },
      { value: 'marble', label: 'Marble' }, { value: 'butcher block', label: 'Butcher Block' },
    ]},
    { label: 'Color', options: [
      { value: 'white', label: 'White' }, { value: 'gray', label: 'Gray' },
      { value: 'black', label: 'Black' }, { value: 'calacatta', label: 'Calacatta' },
    ]},
  ],
  backsplash: [
    { label: 'Type', options: [
      { value: 'subway tile', label: 'Subway Tile' }, { value: 'herringbone', label: 'Herringbone' },
      { value: 'mosaic', label: 'Mosaic' }, { value: 'marble slab', label: 'Marble Slab' },
    ]},
    { label: 'Color', options: [
      { value: 'white', label: 'White' }, { value: 'gray', label: 'Gray' },
      { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' },
    ]},
  ],
  siding: [
    { label: 'Type', options: [
      { value: 'vinyl', label: 'Vinyl' }, { value: 'fiber cement', label: 'Fiber Cement' },
      { value: 'wood', label: 'Wood' }, { value: 'brick', label: 'Brick' },
    ]},
    { label: 'Color', options: [
      { value: 'white', label: 'White' }, { value: 'gray', label: 'Gray' },
      { value: 'navy blue', label: 'Navy Blue' }, { value: 'sage green', label: 'Sage Green' },
    ]},
  ],
  roof: [
    { label: 'Type', options: [
      { value: 'asphalt shingle', label: 'Asphalt Shingle' }, { value: 'metal', label: 'Metal' },
      { value: 'tile', label: 'Tile' }, { value: 'slate', label: 'Slate' },
    ]},
    { label: 'Color', options: [
      { value: 'charcoal gray', label: 'Charcoal' }, { value: 'black', label: 'Black' },
      { value: 'brown', label: 'Brown' }, { value: 'terracotta', label: 'Terracotta' },
    ]},
  ],
  vanity: [{ label: 'Color', options: [
    { value: 'white', label: 'White' }, { value: 'gray', label: 'Gray' },
    { value: 'navy', label: 'Navy' }, { value: 'natural wood', label: 'Natural Wood' },
  ]}],
  shower: [], fireplace: [], landscaping: [],
};

const STYLES = ['Modern', 'Contemporary', 'Traditional', 'Farmhouse', 'Minimalist', 'Luxury', 'Coastal', 'Industrial'];

// ============================================
// MAIN COMPONENT
// ============================================
export default function VirtualRenovationPage() {
  const searchParams = useSearchParams();
  const listingIdParam = searchParams.get('listing');

  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingPhotos, setListingPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState(false);

  const [roomType, setRoomType] = useState<'interior' | 'exterior'>('interior');
  const [style, setStyle] = useState('Modern');
  const [selectedRenovations, setSelectedRenovations] = useState<string[]>([]);
  const [detailedOptions, setDetailedOptions] = useState<Record<string, Record<string, string>>>({});
  const [expandedOptions, setExpandedOptions] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);

  // Load listings
  useEffect(() => {
    async function loadListings() {
      setLoadingListings(true);
      try {
        const res = await fetch('/api/listings');
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data.listings || [];
          setListings(arr);
          if (listingIdParam) {
            const found = arr.find((l: Listing) => l.id === listingIdParam);
            if (found) handleSelectListing(found);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoadingListings(false); }
    }
    loadListings();
  }, [listingIdParam]);

  // Select listing
  const handleSelectListing = async (listing: Listing) => {
    setSelectedListing(listing);
    setUploadMode(false);
    setUploadedFile(null);
    setSelectedPhoto(null);
    setResultUrl(null);
    setLoadingPhotos(true);

    try {
      const res = await fetch(`/api/listings/${listing.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.photos?.length) {
          const urls = data.photos.map((p: any) => p.signedProcessedUrl || p.signedOriginalUrl || p.processed_url || p.raw_url).filter(Boolean);
          setListingPhotos(urls);
          if (urls[0]) setSelectedPhoto(urls[0]);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoadingPhotos(false); }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setSelectedPhoto(URL.createObjectURL(file));
    setUploadMode(true);
    setSelectedListing(null);
    setListingPhotos([]);
    setResultUrl(null);
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url || data.publicUrl;
  };

  // Toggle renovation
  const toggleRenovation = (id: string) => {
    setSelectedRenovations(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    if (!detailedOptions[id] && RENOVATION_OPTIONS[id]?.length) {
      const defaults: Record<string, string> = {};
      RENOVATION_OPTIONS[id].forEach(opt => { defaults[opt.label.toLowerCase()] = opt.options[0]?.value || ''; });
      setDetailedOptions(prev => ({ ...prev, [id]: defaults }));
    }
    setExpandedOptions(id);
  };

  const updateOption = (renoId: string, optKey: string, value: string) => {
    setDetailedOptions(prev => ({ ...prev, [renoId]: { ...prev[renoId], [optKey]: value } }));
  };

  // Process
  const handleRenovate = async () => {
    if (!selectedPhoto || selectedRenovations.length === 0) return;
    setLoading(true); setError(null); setResultUrl(null); setSteps([]);

    try {
      let imageUrl = selectedPhoto;
      if (uploadedFile && selectedPhoto.startsWith('blob:')) {
        setSteps(['Uploading image...']);
        imageUrl = await uploadToStorage(uploadedFile);
        setSteps(['Image uploaded', 'Starting renovation...']);
      }

      const response = await fetch('/api/renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, roomType, style, selectedRenovations, detailedOptions }),
      });
      const data = await response.json();

      if (data.success && data.resultUrl) {
        setResultUrl(data.resultUrl);
        setSteps(data.steps || []);
      } else {
        setError(data.error || 'Renovation failed');
        setSteps(data.steps || []);
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(resultUrl)}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `renovation-${Date.now()}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(resultUrl, '_blank'); }
  };

  const getCoverPhoto = (listing: Listing) => {
    if (listing.photos?.[0]) {
      const p = listing.photos[0];
      return p.signedProcessedUrl || p.signedOriginalUrl || p.processed_url || p.raw_url;
    }
    return null;
  };

  // ============================================
  // RENDER: Listing Selection
  // ============================================
  if (!selectedListing && !uploadMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#D4A017] to-[#FFD700] bg-clip-text text-transparent mb-2">
            Virtual Renovation
          </h1>
          <p className="text-gray-400 mb-8">Transform your space with AI-powered renovations</p>

          {/* Upload Option */}
          <label className="block mb-8 cursor-pointer">
            <div className="border-2 border-dashed border-[#D4A017]/40 rounded-2xl p-10 text-center hover:border-[#D4A017] hover:bg-[#D4A017]/5 transition-all">
              <Upload className="w-12 h-12 mx-auto mb-4 text-[#D4A017]" />
              <p className="text-xl font-medium mb-2">Upload a Photo</p>
              <p className="text-gray-500">PNG, JPG up to 10MB</p>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </label>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-sm">OR SELECT A LISTING</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {loadingListings ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 bg-black/30 rounded-2xl border border-white/10">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-3">No listings found</p>
              <Link href="/dashboard/listings/new" className="text-[#D4A017] hover:underline">Create your first listing</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(listing => (
                <button
                  key={listing.id}
                  onClick={() => handleSelectListing(listing)}
                  className="bg-black/40 border border-white/10 rounded-xl overflow-hidden text-left hover:border-[#D4A017]/50 transition-all group"
                >
                  <div className="aspect-[4/3] bg-black/50 relative">
                    {getCoverPhoto(listing) ? (
                      <img src={getCoverPhoto(listing)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Building className="w-10 h-10 text-gray-700" /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate group-hover:text-[#D4A017]">{listing.address}</p>
                    <p className="text-xs text-gray-500 mt-1">{listing.city}, {listing.state}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Renovation Editor
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedListing(null); setUploadMode(false); }} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#D4A017]">Virtual Renovation</h1>
              {selectedListing && <p className="text-sm text-gray-400">{selectedListing.address}</p>}
            </div>
          </div>
          <button
            onClick={handleRenovate}
            disabled={loading || !selectedPhoto || selectedRenovations.length === 0}
            className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-[#D4A017] to-[#FFD700] text-black disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT: Photo Selection */}
          <div className="col-span-3 space-y-4">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">SELECT PHOTO</h3>
              
              {loadingPhotos ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#D4A017]" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {listingPhotos.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedPhoto(url); setResultUrl(null); }}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPhoto === url ? 'border-[#D4A017] ring-2 ring-[#D4A017]/30' : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <label className="block mt-3">
                <div className="border border-dashed border-white/20 rounded-lg p-3 text-center cursor-pointer hover:border-[#D4A017]/50 transition-colors">
                  <Upload className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                  <p className="text-xs text-gray-500">Upload different</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* CENTER: Preview */}
          <div className="col-span-5 space-y-4">
            {/* Before/After */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Before</p>
                  <div className="aspect-[4/3] bg-black/50 rounded-lg overflow-hidden">
                    {selectedPhoto ? (
                      <img src={selectedPhoto} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <span className="text-sm">Select a photo</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">After</p>
                  <div className="aspect-[4/3] bg-black/50 rounded-lg overflow-hidden relative">
                    {loading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017] mb-2" />
                        <p className="text-xs text-gray-500">Processing...</p>
                      </div>
                    ) : resultUrl ? (
                      <img src={resultUrl} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Sparkles className="w-6 h-6 opacity-30" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {resultUrl && (
                <div className="mt-4 flex gap-2">
                  <button onClick={handleDownload} className="flex-1 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={() => { setResultUrl(null); setSteps([]); }} className="flex-1 py-2 bg-white/10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/20">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              )}
            </div>

            {/* Processing Log */}
            {steps.length > 0 && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Processing Log</h3>
                <div className="space-y-1 text-xs">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {step.startsWith('Completed') ? <CheckCircle className="w-3 h-3 text-green-500" /> :
                       step.startsWith('Failed') ? <XCircle className="w-3 h-3 text-red-500" /> :
                       <div className="w-3 h-3 rounded-full bg-[#D4A017]/30" />}
                      <span className={step.startsWith('Completed') ? 'text-green-400' : step.startsWith('Failed') ? 'text-red-400' : 'text-gray-400'}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
                <XCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>

          {/* RIGHT: Controls */}
          <div className="col-span-4 space-y-4">
            {/* Room Type */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">ROOM TYPE</h3>
              <div className="flex gap-2">
                {(['interior', 'exterior'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => { setRoomType(type); setSelectedRenovations([]); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      roomType === type ? 'bg-[#D4A017] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">DESIGN STYLE</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`py-1.5 px-2 rounded text-xs font-medium transition-all ${
                      style === s ? 'bg-[#D4A017] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Renovations */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">RENOVATIONS</h3>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {RENOVATION_TYPES[roomType].map(reno => {
                  const Icon = reno.icon;
                  const isSelected = selectedRenovations.includes(reno.id);
                  const hasOptions = RENOVATION_OPTIONS[reno.id]?.length > 0;
                  const isExpanded = expandedOptions === reno.id && isSelected;

                  return (
                    <div key={reno.id} className={`rounded-lg overflow-hidden transition-all ${isSelected ? 'bg-[#D4A017]/10 ring-1 ring-[#D4A017]/30' : 'bg-white/5'}`}>
                      <button
                        onClick={() => toggleRenovation(reno.id)}
                        className="w-full flex items-center gap-2 p-2.5 text-left"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-[#D4A017] bg-[#D4A017]' : 'border-gray-600'}`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-black" />}
                        </div>
                        <Icon className="w-4 h-4 text-[#D4A017]" />
                        <span className="flex-1 text-sm">{reno.name}</span>
                        {hasOptions && isSelected && (
                          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>

                      {isSelected && hasOptions && isExpanded && (
                        <div className="px-2.5 pb-2.5 space-y-2">
                          {RENOVATION_OPTIONS[reno.id].map(opt => (
                            <div key={opt.label}>
                              <label className="text-xs text-gray-500 mb-1 block">{opt.label}</label>
                              <select
                                value={detailedOptions[reno.id]?.[opt.label.toLowerCase()] || opt.options[0]?.value}
                                onChange={(e) => updateOption(reno.id, opt.label.toLowerCase(), e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs"
                              >
                                {opt.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}

                      {'warning' in reno && isSelected && (
                        <div className="px-2.5 pb-2 flex items-center gap-1.5 text-xs text-yellow-500">
                          <AlertTriangle className="w-3 h-3" /> May have limited accuracy
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="bg-[#D4A017]/5 border border-[#D4A017]/20 rounded-xl p-4">
              <h3 className="text-sm font-medium text-[#D4A017] mb-2">How it works</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• AI segments the element (wall, floor, cabinets)</li>
                <li>• Only that element changes — rest stays intact</li>
                <li>• Processing takes 1-2 minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
