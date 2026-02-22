/**
 * AI Director - Room Checklist System
 * Manages which rooms need to be photographed for a listing
 */

import type { PhotoType, RoomChecklistItem, PropertyType } from '../../types/shared';

/** Human-readable labels for each PhotoType */
export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  exterior_front: 'Front Exterior',
  exterior_back: 'Backyard / Rear',
  exterior_side: 'Side Exterior',
  interior_living: 'Living Room',
  interior_kitchen: 'Kitchen',
  interior_bedroom: 'Bedroom',
  interior_bathroom: 'Bathroom',
  interior_dining: 'Dining Room',
  interior_office: 'Office / Study',
  interior_other: 'Other Interior',
  drone: 'Aerial / Drone',
  detail: 'Detail Shot',
  unknown: 'Other',
};

/** Default room checklists by property type */
const DEFAULT_CHECKLISTS: Record<PropertyType, { roomType: PhotoType; label: string; required: boolean }[]> = {
  house: [
    { roomType: 'exterior_front', label: 'Front Exterior', required: true },
    { roomType: 'exterior_back', label: 'Backyard', required: true },
    { roomType: 'interior_kitchen', label: 'Kitchen', required: true },
    { roomType: 'interior_living', label: 'Living Room', required: true },
    { roomType: 'interior_bedroom', label: 'Master Bedroom', required: true },
    { roomType: 'interior_bedroom', label: '2nd Bedroom', required: false },
    { roomType: 'interior_bathroom', label: 'Master Bathroom', required: true },
    { roomType: 'interior_bathroom', label: '2nd Bathroom', required: false },
    { roomType: 'interior_dining', label: 'Dining Room', required: false },
    { roomType: 'exterior_back', label: 'Backyard / Pool', required: false },
  ],
  apartment: [
    { roomType: 'exterior_front', label: 'Building Exterior', required: false },
    { roomType: 'interior_kitchen', label: 'Kitchen', required: true },
    { roomType: 'interior_living', label: 'Living Room', required: true },
    { roomType: 'interior_bedroom', label: 'Bedroom', required: true },
    { roomType: 'interior_bathroom', label: 'Bathroom', required: true },
    { roomType: 'interior_other', label: 'View / Balcony', required: false },
  ],
  condo: [
    { roomType: 'exterior_front', label: 'Building Exterior', required: false },
    { roomType: 'interior_kitchen', label: 'Kitchen', required: true },
    { roomType: 'interior_living', label: 'Living Room', required: true },
    { roomType: 'interior_bedroom', label: 'Master Bedroom', required: true },
    { roomType: 'interior_bedroom', label: '2nd Bedroom', required: false },
    { roomType: 'interior_bathroom', label: 'Bathroom', required: true },
    { roomType: 'interior_other', label: 'View / Balcony', required: false },
  ],
  townhouse: [
    { roomType: 'exterior_front', label: 'Front Exterior', required: true },
    { roomType: 'interior_kitchen', label: 'Kitchen', required: true },
    { roomType: 'interior_living', label: 'Living Room', required: true },
    { roomType: 'interior_bedroom', label: 'Master Bedroom', required: true },
    { roomType: 'interior_bedroom', label: '2nd Bedroom', required: false },
    { roomType: 'interior_bathroom', label: 'Bathroom', required: true },
    { roomType: 'interior_dining', label: 'Dining Room', required: false },
    { roomType: 'exterior_back', label: 'Patio / Yard', required: false },
  ],
  commercial: [
    { roomType: 'exterior_front', label: 'Building Exterior', required: true },
    { roomType: 'interior_other', label: 'Reception / Lobby', required: true },
    { roomType: 'interior_office', label: 'Conference Room', required: false },
    { roomType: 'interior_office', label: 'Open Floor', required: true },
    { roomType: 'interior_other', label: 'Break Room', required: false },
    { roomType: 'interior_bathroom', label: 'Restroom', required: false },
  ],
};

/** Create a fresh checklist for a property type */
export function createChecklist(propertyType: PropertyType): RoomChecklistItem[] {
  const template = DEFAULT_CHECKLISTS[propertyType];
  return template.map(item => ({
    ...item,
    captured: false,
  }));
}

/** Mark a room as captured based on detected PhotoType */
export function markRoomCaptured(
  checklist: RoomChecklistItem[],
  detectedType: PhotoType,
  photoId: string,
  score: number
): RoomChecklistItem[] {
  const index = checklist.findIndex(
    item => item.roomType === detectedType && !item.captured
  );
  if (index === -1) return checklist;

  const updated = [...checklist];
  updated[index] = { ...updated[index], captured: true, photoId, score };
  return updated;
}

/** Get the next suggested room to capture */
export function getNextSuggestedRoom(checklist: RoomChecklistItem[]): RoomChecklistItem | null {
  return (
    checklist.find(item => item.required && !item.captured) ??
    checklist.find(item => !item.required && !item.captured) ??
    null
  );
}

/** Calculate checklist progress */
export function getChecklistProgress(checklist: RoomChecklistItem[]) {
  const total = checklist.length;
  const captured = checklist.filter(item => item.captured).length;
  const requiredTotal = checklist.filter(item => item.required).length;
  const requiredCaptured = checklist.filter(item => item.required && item.captured).length;

  return {
    captured,
    total,
    requiredCaptured,
    requiredTotal,
    percentage: total > 0 ? Math.round((captured / total) * 100) : 0,
    allRequiredDone: requiredCaptured >= requiredTotal,
  };
}
