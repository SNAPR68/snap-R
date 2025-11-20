export const dynamic = "force-dynamic";
import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Image from "next/image";
import BeforeAfterSlider from "@/components/ui/before-after-slider";
import ListingDate from "@/components/ui/listing-date";

export const revalidate = 60;

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const { user } = await protect();
  const supabase = createSupabaseServerClient();

  // Fetch listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!listing) {
    return (
      <div className="text-red-600 text-lg">
        Listing not found or you do not have access.
      </div>
    );
  }

  // Fetch photos under this listing
  const { data: photos } = await supabase
    .from("photos")
    .select("id, raw_url, processed_url")
    .eq("listing_id", listing.id);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold mb-2 break-words">
          {listing.title}
        </h1>
        <p className="text-[var(--text-soft)] text-sm md:text-base">
          Created: <ListingDate date={listing.created_at} />
        </p>
      </div>

      {/* Empty state */}
      {!photos || photos.length === 0 ? (
        <div className="text-center py-12 md:py-20">
          <h2 className="text-lg md:text-xl font-semibold mb-2">No Photos</h2>
          <p className="text-[var(--text-soft)] text-sm md:text-base">
            This listing has no enhanced photos yet.
          </p>
        </div>
      ) : (
        // Photo grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {photos.map((photo: any) => (
            <div
              key={photo.id}
              className="rounded-xl overflow-hidden card w-full"
            >
              {photo.processed_url ? (
                <BeforeAfterSlider
                  before={photo.raw_url}
                  after={photo.processed_url}
                />
              ) : (
                <div className="relative w-full h-[250px] md:h-[350px] bg-[var(--surface-soft)]">
                  {/* Raw Only */}
                  <Image
                    src={photo.raw_url}
                    alt="raw photo"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
