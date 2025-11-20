"use client";
export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import BeforeAfterSlider from "@/components/ui/before-after-slider";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Repeat,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

interface JobPhoto {
  id: string;
  raw_url: string | null;
  processed_url: string | null;
  status: string;
  error?: string | null;
  created_at?: string;
  processed_at?: string | null;
}

interface JobResponse {
  id: string;
  status: string;
  variant?: string | null;
  error?: string | null;
  completed_at?: string | null;
  photos: JobPhoto[];
}

const renderStatusPill = (status: string) => {
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

export default function JobStatusPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [success, setSuccess] = useState<string>("");

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to fetch job status");
      }
      const data: JobResponse = await res.json();
      setJob(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch job status");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 4500);
    return () => clearInterval(interval);
  }, [fetchJob]);

  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchJob();
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    setSuccess("");
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Unable to retry job");
      }
      setSuccess("Job re-queued. We'll start processing shortly.");
      fetchJob();
    } catch (err: any) {
      setError(err.message || "Failed to retry job");
    } finally {
      setRetrying(false);
    }
  };

  const totalPhotos = job?.photos?.length ?? 0;
  const completedCount = useMemo(
    () => job?.photos?.filter((photo) => photo.status === "completed").length ?? 0,
    [job]
  );
  const failedCount = useMemo(
    () => job?.photos?.filter((photo) => photo.status === "failed").length ?? 0,
    [job]
  );
  const progress = totalPhotos ? Math.round((completedCount / totalPhotos) * 100) : 0;

  if (loading && !job) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-gold)] mx-auto mb-4" />
        <p className="text-[var(--text-soft)]">Loading job status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Job status</h1>
          <p className="text-[var(--text-soft)] text-sm mt-1 break-all">ID: {jobId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="btn-soft flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {job?.status === "failed" && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="btn-gold flex items-center gap-2"
            >
              <Repeat className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              Retry job
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-[var(--mint-soft)] border border-mint-dark rounded-xl text-[var(--charcoal)]">
          {success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-[var(--text-soft)]">Overall status</p>
          <div className="mt-2">{renderStatusPill(job?.status || "queued")}</div>
          <p className="text-xs text-[var(--text-soft)] mt-2">
            Variant: {job?.variant || "Not specified"}
          </p>
          {job?.error && <p className="text-xs text-red-600 mt-1">{job.error}</p>}
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-soft)]">Progress</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1 text-[var(--text-soft)]">
              <span>
                {completedCount} / {totalPhotos} complete
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[var(--surface-soft)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-gold)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {failedCount > 0 && (
              <p className="text-xs text-red-600 mt-2">{failedCount} photo(s) failed</p>
            )}
          </div>
        </div>
        <div className="card p-4 space-y-2">
          <p className="text-sm text-[var(--text-soft)]">Timestamps</p>
          <div className="text-xs text-[var(--text-soft)] space-y-1">
            <p>
              Started:{" "}
              {job?.photos?.[0]?.created_at
                ? new Date(job.photos[0].created_at as string).toLocaleString()
                : "—"}
            </p>
            <p>
              Completed:{" "}
              {job?.completed_at ? new Date(job.completed_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Photos</h2>
          <span className="text-sm text-[var(--text-soft)]">{totalPhotos} file(s)</span>
        </div>
        {!job?.photos?.length ? (
          <div className="text-center py-16 text-[var(--text-soft)]">
            <ImageIcon className="mx-auto mb-4 w-10 h-10" />
            No photos attached to this job.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.photos.map((photo) => (
              <div key={photo.id} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Photo #{photo.id.slice(0, 6)}</p>
                    {photo.error && <p className="text-xs text-red-600 mt-1">{photo.error}</p>}
                  </div>
                  {renderStatusPill(photo.status)}
                </div>

                {photo.raw_url && photo.processed_url ? (
                  <BeforeAfterSlider before={photo.raw_url} after={photo.processed_url} />
                ) : (
                  <div className="relative w-full h-64 bg-[var(--surface-soft)] rounded-xl overflow-hidden flex items-center justify-center">
                    {photo.processed_url ? (
                      <Image src={photo.processed_url} alt="Processed photo" fill className="object-cover" />
                    ) : photo.raw_url ? (
                      <Image src={photo.raw_url} alt="Original photo" fill className="object-cover" />
                    ) : (
                      <span className="text-sm text-[var(--text-soft)]">File not available</span>
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
      </section>
    </div>
  );
}
