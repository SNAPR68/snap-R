export const dynamic = "force-dynamic";
import { protect } from "@/lib/auth/protect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import JobTimestamp from "@/components/ui/job-timestamp";

export const revalidate = 60;

export default async function JobsPage() {
  const { user } = await protect();
  const supabase = createSupabaseServerClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, status, created_at, updated_at")
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
        <h2 className="text-2xl font-semibold mb-2">
          No Jobs Found
        </h2>
        <p className="text-[var(--text-soft)]">
          You haven't processed any photos yet.
        </p>
        <Link
          href="/upload"
          className="btn-gold inline-block mt-6"
        >
          Upload Photos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6 md:mb-8">
        Recent Jobs
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="card hover:shadow-gold transition block"
          >
            <div className="space-y-3">
              {/* Job ID */}
              <div className="font-mono text-xs md:text-sm text-[var(--text-soft)] break-all">
                {job.id.slice(0, 10)}...
              </div>

              {/* Status */}
              <StatusBadge status={job.status} />

              {/* Timestamps */}
              <div className="text-[var(--text-soft)] text-sm">
                Created: <JobTimestamp date={job.created_at} />
              </div>
              <div className="text-[var(--text-soft)] text-sm">
                Updated: <JobTimestamp date={job.updated_at} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${styles}`}
    >
      {icon}
      {text}
    </div>
  );
}
