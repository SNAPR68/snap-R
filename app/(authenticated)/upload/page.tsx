"use client";
export const dynamic = "force-dynamic";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import FileCount from "@/components/ui/file-count";

interface Listing {
  id: string;
  title: string;
  description?: string | null;
  address?: string | null;
}

const VARIANTS = [
  { value: "sky-replacement", label: "Sky Replacement" },
  { value: "hdr-enhance", label: "HDR Enhancement" },
  { value: "declutter", label: "Declutter" },
];

export default function UploadPage() {
  const router = useRouter();

  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingLoading, setListingLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [variant, setVariant] = useState<string>("sky-replacement");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [newListing, setNewListing] = useState({
    title: "",
    address: "",
    description: "",
  });
  const [creatingListing, setCreatingListing] = useState(false);

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

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const fetchListings = useCallback(async () => {
    setListingLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (!res.ok) {
        throw new Error("Failed to fetch listings");
      }
      const data = await res.json();
      setListings(data);
      if (data.length > 0) {
        setSelectedListing(data[0].id);
      }
    } catch (error: any) {
      console.error(error);
      setError(error?.message || "Failed to load listings");
    } finally {
      setListingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleCreateListing = async (e: FormEvent) => {
    e.preventDefault();
    if (!newListing.title.trim()) {
      setError("Listing title is required");
      return;
    }
    setCreatingListing(true);
    setError("");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newListing.title,
          address: newListing.address,
          description: newListing.description,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || "Failed to create listing");
      }
      setNewListing({ title: "", address: "", description: "" });
      await fetchListings();
      setSuccess("Listing created successfully. You can now upload photos.");
    } catch (error: any) {
      setError(error?.message || "Failed to create listing");
    } finally {
      setCreatingListing(false);
    }
  };

  const startProcessing = async () => {
    if (files.length === 0 || loading) return;
    if (!selectedListing) {
      setError("Please select a listing");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("listingId", selectedListing);
      formData.append("variant", variant);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Upload failed");
      }

      const json = await response.json();
      router.push(`/jobs/${json.jobId}`);
    } catch (error: any) {
      console.error(error);
      setError(error?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedListingDetails = useMemo(
    () => listings.find((listing) => listing.id === selectedListing),
    [listings, selectedListing]
  );

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Upload Photos</h1>
        <p className="text-[var(--text-soft)]">
          Attach photos to a listing and choose the enhancement variant you want us to run.
        </p>
        </div>

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[var(--mint-soft)] text-[var(--charcoal)] text-sm p-3 rounded-xl">
          {success}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold">Select Listing</h2>
          {listingLoading ? (
            <p className="text-[var(--text-soft)] text-sm">Loading listings...</p>
          ) : listings.length === 0 ? (
            <p className="text-[var(--text-soft)] text-sm">
              No listings yet. Create one using the form on the right.
            </p>
          ) : (
            <select
              value={selectedListing}
              onChange={(e) => setSelectedListing(e.target.value)}
              className="input"
            >
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>
          )}

          {selectedListingDetails && (
            <div className="text-sm text-[var(--text-soft)] space-y-1">
              {selectedListingDetails.address && (
                <p>{selectedListingDetails.address}</p>
              )}
              {selectedListingDetails.description && (
                <p>{selectedListingDetails.description}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Enhancement Variant</label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              className="input mt-2"
            >
              {VARIANTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form className="card p-4 md:p-6 space-y-4" onSubmit={handleCreateListing}>
          <h2 className="text-lg font-semibold">Create New Listing</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                className="input mt-1"
                value={newListing.title}
                onChange={(e) =>
                  setNewListing((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Listing title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <input
                className="input mt-1"
                value={newListing.address}
                onChange={(e) =>
                  setNewListing((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="123 Mountain View"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="input mt-1"
                rows={3}
                value={newListing.description}
                onChange={(e) =>
                  setNewListing((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Short highlight for this property"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-soft w-full"
            disabled={creatingListing}
          >
            {creatingListing ? "Creating..." : "Create Listing"}
          </button>
        </form>
      </section>

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

      {files.length > 0 && <FileCount count={files.length} />}

      <button
        onClick={startProcessing}
        disabled={loading || files.length === 0 || listingLoading}
        className={`
          btn-gold w-full md:w-auto mt-4 ${
            loading || files.length === 0 || listingLoading
              ? "opacity-50 cursor-not-allowed"
              : ""
          }
        `}
      >
        {loading ? "Processing..." : "Start Processing"}
      </button>
    </div>
  );
}
