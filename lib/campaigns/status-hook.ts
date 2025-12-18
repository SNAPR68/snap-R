// lib/campaigns/status-hook.ts
// Hook to trigger campaigns when listing status changes

import { triggerCampaign, LISTING_STATUSES, ListingStatus } from './engine';
import { processCampaignContent } from './content-generator';

interface StatusChangeParams {
  userId: string;
  listingId: string;
  newStatus: string;
  previousStatus?: string;
}

// Call this function whenever a listing status is updated
export async function onListingStatusChange({
  userId,
  listingId,
  newStatus,
  previousStatus,
}: StatusChangeParams): Promise<{ triggered: boolean; campaignId?: string; error?: string }> {
  // Validate status
  if (!Object.keys(LISTING_STATUSES).includes(newStatus)) {
    return { triggered: false, error: 'Invalid status' };
  }

  // Don't trigger if status hasn't actually changed
  if (newStatus === previousStatus) {
    return { triggered: false, error: 'Status unchanged' };
  }

  try {
    // Trigger the campaign
    const result = await triggerCampaign({
      userId,
      listingId,
      newStatus: newStatus as ListingStatus,
      previousStatus,
    });

    if (result.success && result.campaignId) {
      // Generate content for all queue items
      await processCampaignContent(result.campaignId);
      return { triggered: true, campaignId: result.campaignId };
    }

    return { triggered: false, error: result.error };
  } catch (error) {
    console.error('Status change hook error:', error);
    return { triggered: false, error: 'Failed to trigger campaign' };
  }
}

// Status values that map to campaign triggers
export const CAMPAIGN_STATUSES = {
  'Coming Soon': 'coming_soon',
  'Just Listed': 'just_listed',
  'Active': 'just_listed', // Active = Just Listed
  'Open House': 'open_house',
  'Price Improvement': 'price_drop',
  'Price Reduced': 'price_drop',
  'Under Contract': 'under_contract',
  'Pending': 'under_contract',
  'Sold': 'sold',
  'Closed': 'sold',
} as const;

// Helper to convert display status to campaign status
export function toCampaignStatus(displayStatus: string): string | null {
  return CAMPAIGN_STATUSES[displayStatus as keyof typeof CAMPAIGN_STATUSES] || null;
}
