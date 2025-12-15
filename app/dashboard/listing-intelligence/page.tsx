'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ListingIntelligenceDashboard from '@/components/listing-intelligence/ListingIntelligenceDashboard';
import { Loader2, Brain, Home, Image, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  address?: string;
  thumbnail?: string;
  photoCount: number;
}

function ListingSelector({ listings, onSelect }: { listings: Listing[]; onSelect: (id: string) => void }) {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Listing Intelligence AI</h1>
            <p className="text-white/50">Select a listing to analyze with AI</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Home className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No listings yet</h3>
            <p className="text-white/40 mb-6">Create a listing first to use AI analysis</p>
            <Link href="/listings/new" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400">
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
                  <p className="text-sm text-white/50 truncate">{listing.address || 'No address'}</p>
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

function ListingIntelligenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listing');
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingPhotos, setListingPhotos] = useState<string[]>([]);
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
          return { id: listing.id, title: listing.title, address: listing.address, thumbnail, photoCount: photos.length };
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
      .select('title')
      .eq('id', id)
      .single();
    
    if (listing) {
      setListingTitle(listing.title);
    }

    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', id)
      .order('created_at', { ascending: false });

    if (photos && photos.length > 0) {
      const photoUrls = await Promise.all(
        photos.map(async (photo) => {
          const path = photo.processed_url || photo.raw_url;
          const { data } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(path, 3600);
          return data?.signedUrl || '';
        })
      );
      setListingPhotos(photoUrls.filter(url => url !== ''));
    }
    
    setLoading(false);
  };

  const handleSelectListing = (id: string) => {
    router.push(`/dashboard/listing-intelligence?listing=${id}`);
  };

  const handleApplyEnhancement = (toolId: string, photoUrl: string) => {
    if (listingId) {
      router.push(`/dashboard/studio?id=${listingId}&tool=${toolId}`);
    } else {
      const encodedUrl = encodeURIComponent(photoUrl);
      router.push(`/dashboard/studio?tool=${toolId}&photo=${encodedUrl}`);
    }
  };

  const handleApplyAll = (recommendations: any[]) => {
    sessionStorage.setItem('batchEnhancements', JSON.stringify(recommendations));
    if (listingId) {
      router.push(`/dashboard/studio?id=${listingId}`);
    } else {
      router.push('/dashboard/batch-enhance');
    }
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
    <ListingIntelligenceDashboard
      onApplyEnhancement={handleApplyEnhancement}
      onApplyAll={handleApplyAll}
      preloadedPhotos={listingPhotos}
      listingId={listingId || undefined}
      listingTitle={listingTitle}
      isLoading={loading}
    />
  );
}

export default function ListingIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    }>
      <ListingIntelligenceContent />
    </Suspense>
  );
}
