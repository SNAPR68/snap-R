"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useEffect, useState } from "react";
import PageShell from "@/components/layout/page-shell";
import { api } from "@/lib/api";
import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { getR2PublicUrl } from "@/lib/utils";

export default function JobStatusPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const [status, setStatus] = useState<string>("processing");
  const [photos, setPhotos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const res = await api(`/job-status?id=${jobId}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch job status");
      }

      const data = await res.json();
      setStatus(data.status || "unknown");
      setPhotos(data.photos || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch job status");
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "processing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">Processing Photos</h1>

      <div className="mb-6">
        <p className="text-lg text-gray-600 mb-2">
          Job ID: <span className="font-mono text-sm">{jobId}</span>
        </p>
        <p className="text-xl">
          Status:{" "}
          <span className={`font-semibold ${getStatusColor()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {status === "completed" && photos.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Processed Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {photos.map((photo) => {
              // Convert R2 URLs to public URLs if needed
              const rawUrl = getR2PublicUrl(photo.raw_url);
              const processedUrl = photo.processed_url;

              return (
                <div key={photo.id} className="space-y-2">
                  {rawUrl && processedUrl ? (
                    <BeforeAfterSlider
                      before={rawUrl}
                      after={processedUrl}
                    />
                  ) : (
                    <img
                      src={processedUrl || rawUrl}
                      alt="Processed photo"
                      className="rounded-lg w-full h-64 object-cover shadow"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === "completed" && photos.length === 0 && (
        <p className="text-gray-600">No photos found for this job.</p>
      )}

      {status === "processing" && (
        <div className="mt-6">
          <p className="text-gray-600">Your photos are being processed. This may take a few moments...</p>
        </div>
      )}
    </PageShell>
  );
}




