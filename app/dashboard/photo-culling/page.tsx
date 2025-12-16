'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, Image, Camera, Check, X, ChevronRight, Home, 
  Sparkles, Download, Filter, Grid, List, Eye, RotateCcw,
  Copy, CheckCircle, AlertCircle, Layers, Trash2, Lightbulb, 
  ArrowRight, Scissors, Target, Zap
} from 'lucide-react';
import Link from 'next/link';

interface PhotoScore {
  photoIndex: number;
  photoUrl: string;
  qualityScore: number;
  blurScore: number;
  exposureScore: number;
  compositionScore: number;
  roomType: string;
  isExterior: boolean;
  isDuplicate: boolean;
  isSelected: boolean;
  selectionReason: string;
  recommendedOrder?: number;
  aiFeedback: string;
}

interface CullResult {
  sessionId: string;
  summary: {
    totalPhotos: number;
    selectedCount: number;
    rejectedCount: number;
    duplicateGroups: number;
    duplicatePhotos: number;
    averageQuality: number;
    roomTypeCounts: Record<string, number>;
  };
  selectedPhotos: PhotoScore[];
  rejectedPhotos: PhotoScore[];
  duplicateGroups: { original: number; duplicates: number[] }[];
  processingTime: number;
}

interface Listing {
  id: string;
  title: string;
  address?: string;
  thumbnail?: string | null;
  photoCount: number;
}

function ListingSelector({ listings, onSelect }: { listings: Listing[]; onSelect: (id: string) => void }) {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with explanation */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Scissors className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Smart Photo Culling</h1>
            <p className="text-white/50">AI selects your best shots from large batches</p>
          </div>
        </div>

        {/* What this tool does */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-purple-400 mb-1">What this tool does</h3>
              <p className="text-sm text-white/70">
                Shot 100+ photos? MLS only allows 25-50. This AI analyzes every photo for quality (sharpness, exposure, composition), 
                identifies duplicates, detects room types, and selects the best photos in MLS-optimized order.
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
                <span className="px-2 py-0.5 bg-white/10 rounded">Use BEFORE enhancing</span>
                <ArrowRight className="w-3 h-3" />
                <span className="px-2 py-0.5 bg-white/10 rounded">Saves credits by only enhancing selected photos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Quality Scoring</div>
            <div className="text-xs text-white/40 mt-1">Blur, exposure, composition</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Layers className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Duplicate Detection</div>
            <div className="text-xs text-white/40 mt-1">Remove similar shots</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-sm font-medium">MLS Ordering</div>
            <div className="text-xs text-white/40 mt-1">Hero first, then by room</div>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Select a listing to cull photos</h2>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No listings with photos</h3>
            <p className="text-white/40 mb-6">Upload photos to a listing first</p>
            <Link href="/listings/new" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-400 transition-colors">
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => onSelect(listing.id)}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                  {listing.thumbnail ? (
                    <img src={listing.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-purple-400 transition-colors">
                    {listing.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-white/50 truncate">
                    {listing.address || 'No address'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-white/40">
                    <Image className="w-4 h-4" /> {listing.photoCount}
                  </span>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoCard({ 
  photo, 
  showDetails,
  onToggleSelect 
}: { 
  photo: PhotoScore; 
  showDetails: boolean;
  onToggleSelect?: (index: number) => void;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRoomLabel = (roomType: string) => {
    return roomType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border transition-all ${
      photo.isSelected 
        ? 'border-green-500/50 bg-green-500/5' 
        : photo.isDuplicate
        ? 'border-yellow-500/30 bg-yellow-500/5'
        : 'border-white/10 bg-white/5'
    }`}>
      {/* Image */}
      <div className="aspect-[4/3] relative">
        <img 
          src={photo.photoUrl} 
          alt={`Photo ${photo.photoIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Selection indicator */}
        <div className="absolute top-2 left-2">
          {photo.isSelected ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          ) : photo.isDuplicate ? (
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Layers className="w-4 h-4 text-black" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Order number */}
        {photo.recommendedOrder && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs font-bold">
            #{photo.recommendedOrder}
          </div>
        )}

        {/* Quality score */}
        <div className={`absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-sm font-bold ${getScoreColor(photo.qualityScore)}`}>
          {photo.qualityScore}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">
            {getRoomLabel(photo.roomType)}
          </span>
          {photo.isExterior && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
              Exterior
            </span>
          )}
        </div>

        {showDetails && (
          <>
            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-1 mb-2 text-xs">
              <div className="text-center p-1 bg-white/5 rounded">
                <div className={`font-bold ${getScoreColor(photo.blurScore)}`}>{photo.blurScore}</div>
                <div className="text-white/40">Sharp</div>
              </div>
              <div className="text-center p-1 bg-white/5 rounded">
                <div className={`font-bold ${getScoreColor(photo.exposureScore)}`}>{photo.exposureScore}</div>
                <div className="text-white/40">Exposure</div>
              </div>
              <div className="text-center p-1 bg-white/5 rounded">
                <div className={`font-bold ${getScoreColor(photo.compositionScore)}`}>{photo.compositionScore}</div>
                <div className="text-white/40">Comp</div>
              </div>
            </div>

            {/* Reason */}
            <p className="text-xs text-white/50 line-clamp-2">
              {photo.selectionReason || photo.aiFeedback}
            </p>
          </>
        )}

        {/* Toggle button */}
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(photo.photoIndex)}
            className={`w-full mt-2 py-1.5 rounded text-xs font-medium transition-colors ${
              photo.isSelected
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            {photo.isSelected ? 'Remove' : 'Add'}
          </button>
        )}
      </div>
    </div>
  );
}

function CullingResults({ 
  result, 
  onReset 
}: { 
  result: CullResult;
  onReset: () => void;
}) {
  const [viewMode, setViewMode] = useState<'selected' | 'rejected' | 'all'>('selected');
  const [showDetails, setShowDetails] = useState(false);
  const [localSelected, setLocalSelected] = useState<Set<number>>(
    new Set(result.selectedPhotos.map(p => p.photoIndex))
  );

  const allPhotos = [...result.selectedPhotos, ...result.rejectedPhotos].sort(
    (a, b) => a.photoIndex - b.photoIndex
  );

  const displayPhotos = viewMode === 'selected'
    ? allPhotos.filter(p => localSelected.has(p.photoIndex))
    : viewMode === 'rejected'
    ? allPhotos.filter(p => !localSelected.has(p.photoIndex))
    : allPhotos;

  const handleToggleSelect = (index: number) => {
    setLocalSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleDownloadSelected = () => {
    // Create download list
    const selected = allPhotos
      .filter(p => localSelected.has(p.photoIndex))
      .sort((a, b) => (a.recommendedOrder || 999) - (b.recommendedOrder || 999));
    
    // For now, just copy URLs to clipboard
    const urls = selected.map((p, i) => `${i + 1}. ${p.photoUrl}`).join('\n');
    navigator.clipboard.writeText(urls);
    alert(`${selected.length} photo URLs copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Culling Complete</h1>
              <p className="text-white/50">
                {localSelected.size} of {result.summary.totalPhotos} photos selected
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Session
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-400 mb-1">What's next?</h3>
              <p className="text-sm text-white/70">
                Now enhance only the selected photos using AI tools (sky replacement, twilight, etc.). 
                This saves credits and time by focusing on your best shots.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-green-400">{localSelected.size}</div>
            <div className="text-sm text-white/50">Selected</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-red-400">{result.summary.totalPhotos - localSelected.size}</div>
            <div className="text-sm text-white/50">Rejected</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-yellow-400">{result.summary.duplicatePhotos}</div>
            <div className="text-sm text-white/50">Duplicates</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-purple-400">{result.summary.averageQuality}</div>
            <div className="text-sm text-white/50">Avg Quality</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-2xl font-bold text-blue-400">{(result.processingTime / 1000).toFixed(1)}s</div>
            <div className="text-sm text-white/50">Process Time</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['selected', 'rejected', 'all'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode === 'selected' ? `Selected (${localSelected.size})` :
                 mode === 'rejected' ? `Rejected (${result.summary.totalPhotos - localSelected.size})` :
                 `All (${result.summary.totalPhotos})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`p-2 rounded-lg transition-colors ${
                showDetails ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
              title="Show details"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-lg font-medium hover:bg-green-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Selected
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayPhotos.map(photo => (
            <PhotoCard
              key={photo.photoIndex}
              photo={{
                ...photo,
                isSelected: localSelected.has(photo.photoIndex)
              }}
              showDetails={showDetails}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>

        {displayPhotos.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No photos in this view</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CullingInterface({ 
  listingId, 
  listingTitle,
  photoUrls,
  onBack 
}: { 
  listingId: string;
  listingTitle: string;
  photoUrls: string[];
  onBack: () => void;
}) {
  const [targetCount, setTargetCount] = useState(25);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CullResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCull = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/photo-cull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          targetCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Culling failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return <CullingResults result={result} onReset={() => setResult(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
              <Scissors className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Smart Photo Culling</h1>
              <p className="text-white/50">{listingTitle}</p>
            </div>
          </div>
          <button onClick={onBack} className="text-white/50 hover:text-white transition-colors">
            ← Back
          </button>
        </div>

        {/* Photo Preview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-purple-400" />
            {photoUrls.length} Photos to Analyze
          </h3>
          <div className="grid grid-cols-6 md:grid-cols-10 gap-2 max-h-64 overflow-y-auto">
            {photoUrls.map((url, i) => (
              <img 
                key={i} 
                src={url} 
                alt={`Photo ${i + 1}`}
                className="aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Target Selection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">How many photos to select?</h3>
          <p className="text-white/50 mb-4">
            MLS typically allows 25-50 photos. We'll pick the best ones.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={Math.min(photoUrls.length, 50)}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-purple-400">{targetCount}</span>
              <span className="text-sm text-white/50 ml-1">photos</span>
            </div>
          </div>
        </div>

        {/* What AI Will Do */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">What AI will do</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5" />
              <span className="text-white/70">Score each photo for sharpness, exposure & composition</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5" />
              <span className="text-white/70">Identify room types (kitchen, living room, exterior, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5" />
              <span className="text-white/70">Detect and remove duplicate/similar shots</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 mt-0.5" />
              <span className="text-white/70">Recommend MLS-optimized photo order (hero first)</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleCull}
          disabled={processing || photoUrls.length === 0}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing {photoUrls.length} Photos...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Start AI Culling
            </>
          )}
        </button>

        {processing && (
          <p className="text-center text-white/40 text-sm mt-4">
            This may take 1-3 minutes for large batches
          </p>
        )}
      </div>
    </div>
  );
}

function PhotoCullingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listing');
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [listingTitle, setListingTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingId) {
      loadListingPhotos(listingId);
    } else {
      loadAllListings();
    }
  }, [listingId]);

  const loadAllListings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: listingsData } = await supabase
      .from('listings')
      .select('*, photos(id, raw_url, processed_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingsData) {
      const listingsWithThumbnails = await Promise.all(
        listingsData
          .filter((l: any) => (l.photos || []).length > 0)
          .map(async (listing: any) => {
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
            return { 
              id: listing.id, 
              title: listing.title, 
              address: listing.address,
              thumbnail, 
              photoCount: photos.length 
            };
          })
      );
      setListings(listingsWithThumbnails);
    }
    setLoading(false);
  };

  const loadListingPhotos = async (id: string) => {
    const supabase = createClient();
    
    const { data: listing } = await supabase
      .from('listings')
      .select('title, address')
      .eq('id', id)
      .single();
    
    if (listing) {
      setListingTitle(listing.title || listing.address || 'Untitled Listing');
    }

    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: true });

    if (photos && photos.length > 0) {
      const urls = await Promise.all(
        photos.map(async (photo) => {
          const path = photo.raw_url;
          const { data } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(path, 3600);
          return data?.signedUrl || '';
        })
      );
      setPhotoUrls(urls.filter(url => url !== ''));
    }
    
    setLoading(false);
  };

  const handleSelectListing = (id: string) => {
    router.push(`/dashboard/photo-culling?listing=${id}`);
  };

  const handleBack = () => {
    router.push('/dashboard/photo-culling');
    setPhotoUrls([]);
    loadAllListings();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!listingId) {
    return <ListingSelector listings={listings} onSelect={handleSelectListing} />;
  }

  return (
    <CullingInterface
      listingId={listingId}
      listingTitle={listingTitle}
      photoUrls={photoUrls}
      onBack={handleBack}
    />
  );
}

export default function PhotoCullingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    }>
      <PhotoCullingContent />
    </Suspense>
  );
}
