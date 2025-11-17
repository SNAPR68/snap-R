"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { useState } from "react";
import PageShell from "@/components/layout/page-shell";
import { apiUpload } from "@/lib/api";
import { useRouter } from "next/navigation";
import { UploadBox } from "@/components/ui/upload-box";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload() {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const res = await apiUpload("/upload", formData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();

      if (data.jobId) {
        router.push(`/jobs/${data.jobId}`);
      } else {
        throw new Error("No job ID returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload files");
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">Upload Photos</h1>

      <UploadBox onFiles={setFiles} />

      {files.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-2">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? "Uploading..." : "Start Processing"}
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading && !error && (
        <p className="mt-4 text-gray-600">Uploading and starting enhancement...</p>
      )}
    </PageShell>
  );
}



