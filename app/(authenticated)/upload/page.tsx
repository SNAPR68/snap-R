"use client";
export const dynamic = "force-dynamic";

import { useSession } from "@/app/providers/session-provider";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import FileCount from "@/components/ui/file-count";

export default function UploadPage() {
  const { supabase, user } = useSession();
  const router = useRouter();

  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback((incoming: FileList) => {
    const arr = Array.from(incoming);
    setFiles(arr);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const startProcessing = async () => {
    if (files.length === 0 || loading) return;

    setLoading(true);

    // Create job
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data: job } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        status: "queued",
      })
      .select()
      .single();

    if (!job) {
      setLoading(false);
      return;
    }

    // Upload to Cloudinary
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const cloud = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudRes = await cloud.json();

      // Insert into photos table
      await supabase.from("photos").insert({
        job_id: job.id,
        raw_url: cloudRes.secure_url,
        status: "pending",
      });
    }

    router.push(`/jobs/${job.id}`);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <h1 className="text-2xl md:text-3xl font-semibold">
        Upload Photos
      </h1>

      {/* Upload Box */}
      <div
        className={`
          flex flex-col items-center justify-center p-6 md:p-12 rounded-2xl border-2 border-dashed cursor-pointer transition w-full
          bg-[var(--surface)]
          ${dragActive ? "border-[var(--accent-gold)] bg-[var(--surface-soft)]" : "border-[var(--surface-soft)]"}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <UploadCloud className="w-12 h-12 md:w-16 md:h-16 text-[var(--accent-gold)] mb-3 md:mb-4" />

        <p className="text-base md:text-lg text-center">
          Drag & drop your property photos here
        </p>

        <p className="text-[var(--text-soft)] text-xs md:text-sm mt-2 text-center">
          or click to select files
        </p>

        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* File Count */}
      {files.length > 0 && <FileCount count={files.length} />}

      {/* Button */}
      <button
        onClick={startProcessing}
        disabled={loading || files.length === 0}
        className={`
          btn-gold w-full md:w-auto mt-4 ${loading || files.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {loading ? "Processing..." : "Start Processing"}
      </button>
    </div>
  );
}
