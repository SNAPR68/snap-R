"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/app/providers/session-provider";
import BeforeAfterSlider from "@/components/ui/before-after-slider";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";

export const revalidate = 0;

export default function JobStatusPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const { supabase } = useSession();
  const [status, setStatus] = useState<string>("processing");
  const [photos, setPhotos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("status")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;
      setStatus(job.status || "unknown");

      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("id, raw_url, processed_url, status")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch job status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-mint-soft text-charcoal border border-mint-dark">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        );
      case "failed":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 border border-red-300">
            <XCircle className="w-4 h-4" />
            Failed
          </div>
        );
      case "processing":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[var(--surface-soft)] text-[var(--text-main)] border border-[var(--surface-soft)]">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-gold)]" />
            Processing
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[var(--surface-soft)] text-[var(--text-main)] border border-[var(--surface-soft)]">
            <Clock className="w-4 h-4" />
            Queued
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-gold)] mx-auto mb-4" />
        <p className="text-[var(--text-soft)]">Loading job status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">Processing Photos</h1>
        <div className="mb-6">
          <p className="text-[var(--text-soft)] mb-2 text-sm md:text-base">
            Job ID: <span className="font-mono text-xs md:text-sm break-all">{jobId}</span>
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <span className="text-base md:text-lg text-[var(--text-main)]">Status:</span>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {status === "completed" && photos.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold">Processed Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {photos.map((photo) => {
              if (photo.raw_url && photo.processed_url) {
                return (
                  <div key={photo.id} className="card">
                    <BeforeAfterSlider
                      before={photo.raw_url}
                      after={photo.processed_url}
                    />
                  </div>
                );
              } else if (photo.processed_url) {
                return (
                  <div key={photo.id} className="card">
                    <div className="relative w-full h-[250px] md:h-[350px] bg-[var(--surface-soft)] rounded-xl overflow-hidden">
                      <Image
                        src={photo.processed_url}
                        alt="Processed photo"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                );
              } else if (photo.raw_url) {
                return (
                  <div key={photo.id} className="card">
                    <div className="relative w-full h-[250px] md:h-[350px] bg-[var(--surface-soft)] rounded-xl overflow-hidden">
                      <Image
                        src={photo.raw_url}
                        alt="Raw photo"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {status === "completed" && photos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[var(--text-soft)]">No photos found for this job.</p>
        </div>
      )}

      {status === "processing" && (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-gold)] mx-auto mb-4" />
          <p className="text-[var(--text-soft)] text-lg">
            Your photos are being processed. This may take a few moments...
          </p>
        </div>
      )}
    </div>
  );
}
