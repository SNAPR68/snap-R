import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert R2 storage key to public URL
 * @param r2Key - The R2 storage key (e.g., "raw/job-id/filename.jpg")
 * @returns Public URL for the R2 object
 */
export function getR2PublicUrl(r2Key: string | null | undefined): string | null {
  if (!r2Key) return null;
  
  // If it's already a full URL, return as-is
  if (r2Key.startsWith("http://") || r2Key.startsWith("https://")) {
    return r2Key;
  }
  
  // If it's an R2 key, prepend the public URL
  const publicUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
  if (publicUrl && r2Key.startsWith("raw/")) {
    return `${publicUrl}/${r2Key}`;
  }
  
  return r2Key;
}
