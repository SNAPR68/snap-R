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

/**
 * preparation_metadata.decisionAudit is a Record<string, { photoType, ... }>
 * keyed by photoId, produced by listing-engine/index.ts.
 */
interface PreparationMetadata {
  decisionAudit?: Record<string, { photoType?: string }>;
}

/**
 * Order photos for a cinematic walkthrough video.
 *
 * @param photos - Array of photo records from the database
 * @param preparationMetadata - Optional preparation_metadata from the listing (contains decisionAudit)
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

  // decisionAudit has photoType per photoId (Record keyed by photoId)
  const decisionAudit = preparationMetadata?.decisionAudit;
  if (
    !decisionAudit ||
    typeof decisionAudit !== 'object' ||
    Object.keys(decisionAudit).length === 0
  ) {
    return validPhotos.map((p) => p.processed_url);
  }

  // Build a map of photoId → photoType from the decision audit Record
  const typeMap = new Map<string, PhotoType>(
    Object.entries(decisionAudit)
      .filter(
        (entry): entry is [string, { photoType: string }] =>
          typeof entry[1]?.photoType === 'string'
      )
      .map(([id, data]) => [id, data.photoType as PhotoType])
  );

  // If no valid photoType entries found, return in original order
  if (typeMap.size === 0) {
    return validPhotos.map((p) => p.processed_url);
  }

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

/**
 * Order photos for walkthrough and identify drone/aerial shot indices.
 * Returns both ordered URLs and which indices are drone shots (for video effects).
 */
export function orderPhotosWithDroneInfo(
  photos: PhotoWithUrl[],
  preparationMetadata?: PreparationMetadata | null
): { urls: string[]; droneIndices: number[] } {
  const validPhotos = photos.filter(
    (p): p is PhotoWithUrl & { processed_url: string } =>
      p.processed_url !== null
  );

  if (validPhotos.length === 0) return { urls: [], droneIndices: [] };

  const decisionAudit = preparationMetadata?.decisionAudit;
  if (
    !decisionAudit ||
    typeof decisionAudit !== 'object' ||
    Object.keys(decisionAudit).length === 0
  ) {
    return { urls: validPhotos.map((p) => p.processed_url), droneIndices: [] };
  }

  const typeMap = new Map<string, PhotoType>(
    Object.entries(decisionAudit)
      .filter(
        (entry): entry is [string, { photoType: string }] =>
          typeof entry[1]?.photoType === 'string'
      )
      .map(([id, data]) => [id, data.photoType as PhotoType])
  );

  if (typeMap.size === 0) {
    return { urls: validPhotos.map((p) => p.processed_url), droneIndices: [] };
  }

  const sorted = [...validPhotos].sort((a, b) => {
    const typeA = typeMap.get(a.id) ?? 'unknown';
    const typeB = typeMap.get(b.id) ?? 'unknown';
    const indexA = orderIndex.get(typeA) ?? WALKTHROUGH_ORDER.length;
    const indexB = orderIndex.get(typeB) ?? WALKTHROUGH_ORDER.length;
    return indexA - indexB;
  });

  const droneIndices: number[] = [];
  sorted.forEach((photo, i) => {
    if (typeMap.get(photo.id) === 'drone') {
      droneIndices.push(i);
    }
  });

  return { urls: sorted.map((p) => p.processed_url), droneIndices };
}
