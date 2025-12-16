'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, FileText, Home, ChevronRight, Sparkles, Copy, Check, 
  RefreshCw, Download, Wand2, Building, Heart, Users, Crown,
  Hash, Eye, Clock, Image, AlertCircle, Lightbulb, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  address?: string;
  city?: string;
  state?: string;
  thumbnail?: string;
  photoCount: number;
}

interface GeneratedDescription {
  descriptionId?: string;
  headline: string;
  description: string;
  seoKeywords: string[];
  detectedFeatures: any;
  photoAnalysis: any[];
  stats: {
    characterCount: number;
    wordCount: number;
    tone: string;
    length: string;
    photosAnalyzed: number;
  };
  processingTime: number;
}

const TONES = [
  { id: 'professional', label: 'Professional', icon: Building, description: 'Industry-standard MLS language' },
  { id: 'luxury', label: 'Luxury', icon: Crown, description: 'Upscale, sophisticated appeal' },
  { id: 'casual', label: 'Casual', icon: Heart, description: 'Warm and welcoming tone' },
  { id: 'first_time_buyer', label: 'First-Time Buyer', icon: Users, description: 'Accessible and encouraging' },
];

const LENGTHS = [
  { id: 'short', label: 'Short', chars: '100-200', description: 'Social media / quick preview' },
  { id: 'medium', label: 'Medium', chars: '400-600', description: 'Standard MLS listing' },
  { id: 'full', label: 'Full', chars: '1500-2500', description: 'Detailed property showcase' },
];

function ListingSelector({ listings, onSelect }: { listings: Listing[]; onSelect: (id: string) => void }) {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with explanation */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
            <FileText className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Description Generator</h1>
            <p className="text-white/50">Write MLS-ready property descriptions from your photos</p>
          </div>
        </div>

        {/* What this tool does */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">What this tool does</h3>
              <p className="text-sm text-white/70">
                AI analyzes your listing photos to detect features (pool, fireplace, kitchen style, etc.) 
                and writes compelling property descriptions ready for MLS, Zillow, or marketing materials. 
                Choose from 4 tones and 3 lengths.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                <span className="px-2 py-0.5 bg-white/10 rounded">Use AFTER enhancing photos</span>
                <ArrowRight className="w-3 h-3" />
                <span className="px-2 py-0.5 bg-white/10 rounded">Before listing on MLS</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Select a listing to generate description</h2>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Home className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No listings yet</h3>
            <p className="text-white/40 mb-6">Create a listing first to generate descriptions</p>
            <Link href="/listings/new" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-colors">
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => onSelect(listing.id)}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
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
                  <h3 className="font-semibold truncate group-hover:text-amber-400 transition-colors">
                    {listing.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-white/50 truncate">
                    {listing.address ? `${listing.address}, ${listing.city || ''} ${listing.state || ''}` : 'No address'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm text-white/40">
                    <Image className="w-4 h-4" /> {listing.photoCount}
                  </span>
                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DescriptionGenerator({ 
  listingId, 
  listingTitle,
  photoUrls 
}: { 
  listingId: string;
  listingTitle: string;
  photoUrls: string[];
}) {
  const [tone, setTone] = useState<string>('professional');
  const [length, setLength] = useState<string>('medium');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedDescription | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          tone,
          length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    const textToCopy = `${result.headline}\n\n${result.description}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDescription = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Description Generator</h1>
              <p className="text-white/50">{listingTitle}</p>
            </div>
          </div>
          <Link 
            href="/dashboard/ai-descriptions" 
            className="text-white/50 hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>

        {/* Helpful tip */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-6">
          <p className="text-sm text-blue-300">
            <strong>Tip:</strong> The AI will analyze up to 10 photos to detect property features like kitchen style, flooring, views, and amenities, then write a compelling description.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Tone Selection */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-400" />
                Writing Tone
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tone === t.id
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <t.icon className={`w-5 h-5 mb-2 ${tone === t.id ? 'text-amber-400' : 'text-white/50'}`} />
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-white/50 mt-1">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Length Selection */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Description Length
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {LENGTHS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      length === l.id
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`font-medium ${length === l.id ? 'text-amber-400' : ''}`}>{l.label}</div>
                    <div className="text-xs text-white/50 mt-1">{l.chars} chars</div>
                    <div className="text-xs text-white/30 mt-1">{l.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Preview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-amber-400" />
                Photos to Analyze ({photoUrls.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photoUrls.slice(0, 10).map((url, i) => (
                  <img 
                    key={i} 
                    src={url} 
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
                {photoUrls.length > 10 && (
                  <div className="w-20 h-14 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-white/50">+{photoUrls.length - 10}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/40 mt-2">AI will analyze up to 10 photos to detect features</p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || photoUrls.length === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Photos & Writing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Description
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Result Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold">Generated Description</h3>
                {result && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copy All"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                {!result && !generating ? (
                  <div className="text-center py-12 text-white/30">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select options and click Generate</p>
                    <p className="text-xs mt-2">Your MLS-ready description will appear here</p>
                  </div>
                ) : generating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
                    <p className="text-white/50">Analyzing photos...</p>
                    <p className="text-white/30 text-sm mt-1">This may take 15-30 seconds</p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    {/* Headline */}
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wide">Headline</label>
                      <div className="mt-1 p-3 bg-white/5 rounded-lg font-semibold text-amber-400">
                        {result.headline}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-white/40 uppercase tracking-wide">Description</label>
                        <button
                          onClick={handleCopyDescription}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          Copy Description
                        </button>
                      </div>
                      <div className="mt-1 p-3 bg-white/5 rounded-lg text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                        {result.description}
                      </div>
                    </div>

                    {/* SEO Keywords */}
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wide flex items-center gap-1">
                        <Hash className="w-3 h-3" /> SEO Keywords
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.seoKeywords.map((keyword, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-400">{result.stats.characterCount}</div>
                        <div className="text-xs text-white/40">Characters</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-400">{result.stats.wordCount}</div>
                        <div className="text-xs text-white/40">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-400">{result.stats.photosAnalyzed}</div>
                        <div className="text-xs text-white/40">Photos</div>
                      </div>
                    </div>

                    {/* Processing Time */}
                    <div className="text-center text-xs text-white/30 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Generated in {(result.processingTime / 1000).toFixed(1)}s
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIDescriptionsContent() {
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
        listingsData.map(async (listing: any) => {
          const photos = listing.photos || [];
          const firstPhoto = photos.find((p: any) => p.processed_url) || photos[0];
          let thumbnail = null;
          if (firstPhoto) {
            const path = firstPhoto.processed_url || firstPhoto.raw_url;
            if (path && !path.startsWith('http')) {
              const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
              thumbnail = data?.signedUrl;
            } else {
              thumbnail = path;
            }
          }
          return { 
            id: listing.id, 
            title: listing.title, 
            address: listing.address,
            city: listing.city,
            state: listing.state,
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
      .select('title, address, city, state')
      .eq('id', id)
      .single();
    
    if (listing) {
      setListingTitle(listing.title || 'Untitled Listing');
    }

    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: true });

    if (photos && photos.length > 0) {
      const urls = await Promise.all(
        photos.map(async (photo) => {
          const path = photo.processed_url || photo.raw_url;
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
    router.push(`/dashboard/ai-descriptions?listing=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  if (!listingId) {
    return <ListingSelector listings={listings} onSelect={handleSelectListing} />;
  }

  return (
    <DescriptionGenerator
      listingId={listingId}
      listingTitle={listingTitle}
      photoUrls={photoUrls}
    />
  );
}

export default function AIDescriptionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    }>
      <AIDescriptionsContent />
    </Suspense>
  );
}
