"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/page-shell";
import { ListingCard } from "@/components/listing-card";
import { supabase } from "@/lib/supabase";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        // Fetch listings with photo counts
        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (listingsError) throw listingsError;

        // For each listing, get photo count and thumbnail
        const listingsWithPhotos = await Promise.all(
          (listingsData || []).map(async (listing) => {
            const { data: photos } = await supabase
              .from("photos")
              .select("processed_url")
              .eq("listing_id", listing.id)
              .limit(1);

            const { count } = await supabase
              .from("photos")
              .select("*", { count: "exact", head: true })
              .eq("listing_id", listing.id);

            return {
              id: listing.id,
              title: listing.title,
              thumbnail: photos?.[0]?.processed_url || "https://images.unsplash.com/photo-1507089947368-19c1da9775ae",
              count: count || 0,
            };
          })
        );

        setListings(listingsWithPhotos);
      } catch (err: any) {
        setError(err.message || "Failed to fetch listings");
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">Your Listings</h1>

      {loading && <p className="text-gray-600">Loading listings...</p>}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No listings found.</p>
          <p className="text-sm text-gray-500">
            Upload photos to create your first listing.
          </p>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              thumbnail={listing.thumbnail}
              count={listing.count}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}



