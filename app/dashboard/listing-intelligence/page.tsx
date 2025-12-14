'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ListingIntelligenceDashboard from '@/components/listing-intelligence/ListingIntelligenceDashboard';
import { Loader2 } from 'lucide-react';

function ListingIntelligenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listing');
  
  const [listingPhotos, setListingPhotos] = useState<string[]>([]);
  const [listingTitle, setListingTitle] = useState<string>('');
  const [loading, setLoading] = useState(!!listingId);

  useEffect(() => {
    if (listingId) {
      loadListingPhotos(listingId);
    }
  }, [listingId]);

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
