export const dynamic = "force-dynamic";
import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import ListingDate from "@/components/ui/listing-date";

export default async function ListingsPage() {
  const { user } = await protect();
  const supabase = createSupabaseServerClient();

  // Fetch listings + photo counts + cover photo
  const { data: listings, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      created_at,
      photos:photos(
        id,
        processed_url
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-red-600 text-lg">
        Failed to load listings. Please try again later.
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">No Listings</h2>
        <p className="text-[var(--text-soft)]">
          You haven't created any listings yet.
        </p>
        <Link href="/upload" className="btn-gold inline-block mt-6">
          Upload Photos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8">Your Listings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {listings.map((listing: any) => {
          const cover = listing.photos?.[0]?.processed_url;
          const count = listing.photos?.length ?? 0;

          return (
            <Link
              href={`/listings/${listing.id}`}
              key={listing.id}
              className="card hover:shadow-gold transition block"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[var(--surface-soft)]">
                {cover ? (
                  <Image
                    src={cover}
                    alt="Listing thumbnail"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-soft)]">
                    No Photos
                  </div>
                )}
              </div>

              {/* Listing Info */}
              <h3 className="text-xl font-semibold mt-4">{listing.title}</h3>

              {/* Photo count */}
              <div className="mt-2 text-[var(--text-soft)] text-sm">
                {count} photo{count === 1 ? "" : "s"}
              </div>

              {/* Date */}
              <div className="mt-2 text-[var(--text-soft)] text-xs">
                Created: <ListingDate date={listing.created_at} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
