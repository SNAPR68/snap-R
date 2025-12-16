export const dynamic = "force-dynamic";

import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Clock, CheckCircle, XCircle, Loader2, PlusCircle } from "lucide-react";
import JobTimestamp from "@/components/ui/job-timestamp";

export default async function JobsPage() {
  const { user } = await protect();
  const supabase = await createSupabaseServerClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `id,status,variant,created_at,updated_at,
       listing:listings(id,title),
       photos:photos(id, processed_url, status)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-red-600 text-lg">
        Failed to load jobs. Please try again later.
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">No Jobs Found</h2>
        <p className="text-[var(--text-soft)]">You haven't processed any photos yet.</p>
        <Link href="/upload" className="btn-gold inline-flex items-center gap-2 mt-6">
          <PlusCircle className="w-4 h-4" />
          Upload Photos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Recent Jobs</h1>
          <p className="text-[var(--text-soft)] text-sm mt-1">
            Monitor enhancement progress for your listings.
          </p>
        </div>
        <Link href="/upload" className="btn-gold inline-flex items-center gap-2 h-fit">
          <PlusCircle className="w-4 h-4" />
          Upload more photos
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {jobs.map((job: any) => {
          const completed = job.photos?.filter((p: any) => p.status === "completed").length ?? 0;
          const total = job.photos?.length ?? 0;
          const previewPhoto = job.photos?.find((p: any) => !!p.processed_url)?.processed_url;
          const listingData = Array.isArray(job.listing) ? job.listing[0] : job.listing;

          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="card hover:shadow-gold transition flex flex-col"
            >
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[var(--surface-soft)]">
                {previewPhoto ? (
                  <Image
                    src={previewPhoto}
                    alt="Job preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--text-soft)] text-sm">
                    Preview coming soon
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-[var(--text-main)]">
                    {listingData?.title || "Untitled listing"}
                  </div>
                  <StatusPill status={job.status} />
                </div>

                <div className="text-xs text-[var(--text-soft)] uppercase tracking-wide">
                  Variant: {job.variant || "standard"}
                </div>

                <div className="text-sm text-[var(--text-soft)]">
                  Created: <JobTimestamp date={job.created_at} />
                </div>
                <div className="text-sm text-[var(--text-soft)]">
                  Updated: <JobTimestamp date={job.updated_at} />
                </div>

                {total > 0 && (
                  <div className="text-xs text-[var(--text-soft)] flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--surface-soft)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-gold)] transition-all duration-300"
                        style={{ width: `${Math.round((completed / total) * 100)}%` }}
                      />
                    </div>
                    <span>
                      {completed}/{total}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  let icon: React.ReactNode;
  let text: string;
  let styles: string;

  switch (status) {
    case "completed":
      icon = <CheckCircle className="w-4 h-4" />;
      text = "Completed";
      styles = "bg-mint-soft text-charcoal border border-mint-dark";
      break;
    case "failed":
      icon = <XCircle className="w-4 h-4" />;
      text = "Failed";
      styles = "bg-red-100 text-red-700 border border-red-300";
      break;
    case "processing":
      icon = <Loader2 className="w-4 h-4 animate-spin" />;
      text = "Processing";
      styles = "bg-[var(--surface-soft)] text-[var(--text-main)] border border-[var(--surface-soft)]";
      break;
    default:
      icon = <Clock className="w-4 h-4" />;
      text = "Queued";
      styles = "bg-[var(--surface-soft)] text-[var(--text-main)] border border-[var(--surface-soft)]";
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${styles}`}>
      {icon}
      {text}
    </span>
  );
}
