/**
 * Smart photo ordering for property walkthrough videos.
 *
 * Uses existing photoType classification from the AI preparation pipeline
 * (photo-intelligence.ts) to sort photos in a natural walkthrough order:
 * exterior → living areas → kitchen → dining → bedrooms → bathrooms → back/drone
 *
 * Zero additional AI cost — reuses data already computed during listing preparation.
 */

import type { PhotoType } from '@/lib/ai/listing-engine/types';

// Walkthrough order: outside → main living → kitchen → dining → bedrooms → baths → back → aerial
const WALKTHROUGH_ORDER: readonly PhotoType[] = [
  'exterior_front',
  'exterior_side',
  'interior_living',
  'interior_kitchen',
  'interior_dining',
  'interior_bedroom',
  'interior_bathroom',
  'interior_office',
  'interior_other',
  'exterior_back',
  'drone',
  'detail',
  'unknown',
] as const;

const orderIndex = new Map<PhotoType, number>(
  WALKTHROUGH_ORDER.map((type, i) => [type, i])
);

interface PhotoWithUrl {
  id: string;
  processed_url: string | null;
}

interface PhotoAuditEntry {
  photoId: string;
  photoType: PhotoType;
}

interface PreparationMetadata {
  photoAudit?: PhotoAuditEntry[];
}

/**
 * Order photos for a cinematic walkthrough video.
 *
 * @param photos - Array of photo records from the database
 * @param preparationMetadata - Optional preparation_metadata from the listing (contains photoAudit)
 * @returns Photo URLs in walkthrough order
 */
export function orderPhotosForWalkthrough(
  photos: PhotoWithUrl[],
  preparationMetadata?: PreparationMetadata | null
): string[] {
  // Filter to photos with processed URLs
  const validPhotos = photos.filter(
    (p): p is PhotoWithUrl & { processed_url: string } =>
      p.processed_url !== null
  );

  if (validPhotos.length === 0) return [];

  // If no preparation metadata or no photoAudit, return in original order
  const photoAudit = preparationMetadata?.photoAudit;
  if (!photoAudit || photoAudit.length === 0) {
    return validPhotos.map((p) => p.processed_url);
  }

  // Build a map of photoId → photoType from the audit
  const typeMap = new Map<string, PhotoType>(
    photoAudit.map((entry) => [entry.photoId, entry.photoType])
  );

  // Sort photos by walkthrough order
  const sorted = [...validPhotos].sort((a, b) => {
    const typeA = typeMap.get(a.id) ?? 'unknown';
    const typeB = typeMap.get(b.id) ?? 'unknown';
    const indexA = orderIndex.get(typeA) ?? WALKTHROUGH_ORDER.length;
    const indexB = orderIndex.get(typeB) ?? WALKTHROUGH_ORDER.length;
    return indexA - indexB;
  });

  return sorted.map((p) => p.processed_url);
}
