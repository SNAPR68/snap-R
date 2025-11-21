export const dynamic = "force-dynamic";

import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import BeforeAfterSlider from "@/components/ui/before-after-slider";
import ListingDate from "@/components/ui/listing-date";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";

type ListingWithPhotos = {
  id: string;
  title: string;
  address?: string | null;
  description?: string | null;
  created_at: string;
  photos: Array<{
    id: string;
    raw_url: string | null;
    processed_url: string | null;
    status: string;
    variant: string | null;
    error?: string | null;
    created_at: string | null;
    processed_at: string | null;
  }>;
};

const statusPill = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-mint-soft text-charcoal border border-mint-dark">
          <CheckCircle className="w-3.5 h-3.5" /> Completed
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-300">
          <XCircle className="w-3.5 h-3.5" /> Failed
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-soft)] text-[var(--text-main)] border border-[var(--surface-soft)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-gold)]" />
          Processing
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-soft)] text-[var(--text-main)] border border-[var(--surface-soft)]">
          <Clock className="w-3.5 h-3.5" /> Queued
        </span>
      );
  }
};

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const { user } = await protect();
  const supabase = createSupabaseServerClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      `id,title,address,description,created_at,
       photos:photos(id, raw_url, processed_url, status, variant, error, created_at, processed_at)`
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single<ListingWithPhotos>();

  if (!listing) {
    return (
      <div className="text-red-600 text-lg">
        Listing not found or you do not have access.
      </div>
    );
  }

  const photos = (listing.photos ?? []).sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  });

  const total = photos.length;
  const completed = photos.filter((p) => p.status === "completed").length;
  const processing = photos.filter((p) => p.status === "processing").length;
  const failed = photos.filter((p) => p.status === "failed").length;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold break-words">{listing.title}</h1>
            <p className="text-sm text-[var(--text-soft)]">
              Created <ListingDate date={listing.created_at} />
            </p>
          </div>
          <Link href={`/upload?listing=${listing.id}`} className="btn-gold h-fit">
            Upload more photos
          </Link>
        </div>
        {listing.address && (
          <p className="text-sm text-[var(--text-soft)]">{listing.address}</p>
        )}
        {listing.description && (
          <p className="text-sm text-[var(--text-main)]">{listing.description}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--text-soft)]">Total photos</p>
          <p className="text-2xl font-semibold mt-2">{total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-soft)]">Completed</p>
          <p className="text-2xl font-semibold mt-2 text-[var(--accent-gold)]">{completed}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-soft)]">Processing</p>
          <p className="text-2xl font-semibold mt-2 text-blue-500">{processing}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-soft)]">Failed</p>
          <p className="text-2xl font-semibold mt-2 text-red-500">{failed}</p>
        </div>
      </div>

      {!photos.length ? (
        <div className="text-center py-12 md:py-20">
          <h2 className="text-lg md:text-xl font-semibold mb-2">No Photos</h2>
          <p className="text-[var(--text-soft)] text-sm md:text-base">
            This listing has no enhanced photos yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {photos.map((photo) => (
            <div key={photo.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Photo #{photo.id.slice(0, 6)}</p>
                  <p className="text-xs text-[var(--text-soft)] capitalize">
                    Variant: {photo.variant || photos[0]?.variant || "standard"}
                  </p>
                </div>
                {statusPill(photo.status)}
              </div>

              {photo.error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                  {photo.error}
                </p>
              )}

              {photo.raw_url && photo.processed_url ? (
                <BeforeAfterSlider before={photo.raw_url} after={photo.processed_url} />
              ) : (
                <div className="relative w-full h-64 bg-[var(--surface-soft)] rounded-xl overflow-hidden flex items-center justify-center">
                  {photo.processed_url ? (
                    <Image src={photo.processed_url} alt="Processed photo" fill className="object-cover" />
                  ) : photo.raw_url ? (
                    <Image src={photo.raw_url} alt="Raw photo" fill className="object-cover" />
                  ) : (
                    <span className="text-sm text-[var(--text-soft)]">File unavailable</span>
                  )}
                  {photo.status === "processing" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {photo.processed_url && (
                <a
                  href={photo.processed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-soft text-center text-sm"
                >
                  Download processed image
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
