export const dynamic = "force-dynamic";
import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import ListingDate from "@/components/ui/listing-date";

export default async function ListingsPage() {
  const { user } = await protect();
  const supabase = await createSupabaseServerClient();

  // Fetch listings + photo counts + cover photo
  const { data: listings, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      created_at,
      photos:photos(
        id,
        raw_url,
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

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/raw-images/${path}`;
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8">Your Listings</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {listings.map((listing: any) => {
          const cover = listing.photos?.[0]?.processed_url || listing.photos?.[0]?.raw_url;
          const count = listing.photos?.length ?? 0;
          const coverUrl = getImageUrl(cover) || undefined;

          return (
            <Link
              href={`/listings/${listing.id}`}
              key={listing.id}
              className="card hover:shadow-gold transition block"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[var(--surface-soft)]">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt="Listing thumbnail"
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[var(--text-soft)]">
                    No Photos
                  </div>
                )}
              </div>

              {/* Listing Info */}
              <h3 className="text-sm font-semibold mt-3">{listing.title}</h3>

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
