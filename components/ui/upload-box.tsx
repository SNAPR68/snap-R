"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";

export function UploadBox({ onFiles }: { onFiles: (files: File[]) => void }) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition",
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-400"
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-10 w-10 text-gray-500" />
      <p className="mt-4 text-gray-600 text-center">
        Drag & drop your real estate photos here,<br /> or click to select files.
      </p>
    </div>
  );
}



