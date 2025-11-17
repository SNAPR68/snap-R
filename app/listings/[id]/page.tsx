"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PageShell from "@/components/layout/page-shell";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { useParams } from "next/navigation";
import { getR2PublicUrl } from "@/lib/utils";

export default function ListingDetailsPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [listing, setListing] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListingData() {
      try {
        // Initialize Supabase client at runtime
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Fetch listing
        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", listingId)
          .single();

        if (listingError) throw listingError;
        setListing(listingData);

        // Fetch photos for this listing
        const { data: photosData, error: photosError } = await supabase
          .from("photos")
          .select("*")
          .eq("listing_id", listingId)
          .order("created_at", { ascending: true });

        if (photosError) throw photosError;
        setPhotos(photosData || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch listing");
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      fetchListingData();
    }
  }, [listingId]);

  if (loading) {
    return (
      <PageShell>
        <p className="text-gray-600">Loading listing...</p>
      </PageShell>
    );
  }

  if (error || !listing) {
    return (
      <PageShell>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || "Listing not found"}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">{listing.title}</h1>

      {photos.length === 0 && (
        <p className="text-gray-600">No photos available for this listing.</p>
      )}

      {photos.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((photo) => {
              // Convert R2 URLs to public URLs if needed
              const rawUrl = getR2PublicUrl(photo.raw_url);
              const processedUrl = photo.processed_url;

              if (rawUrl && processedUrl) {
                return (
                  <div key={photo.id} className="space-y-2">
                    <BeforeAfterSlider before={rawUrl} after={processedUrl} />
                  </div>
                );
              } else if (processedUrl) {
                return (
                  <div key={photo.id}>
                    <img
                      src={processedUrl}
                      alt="Processed photo"
                      className="rounded-lg w-full h-64 object-cover shadow"
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}



