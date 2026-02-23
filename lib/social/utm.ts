// UTM Parameter Utility
// Appends campaign tracking parameters to URLs for social post attribution

interface UtmParams {
  platform: string;
  postType: string;
  listingId: string;
}

/**
 * Append UTM tracking parameters to a URL.
 * Used when scheduling social posts so we can attribute
 * property site traffic to specific platforms and campaigns.
 */
export function appendUtmParams(url: string, params: UtmParams): string {
  const parsed = new URL(url);
  parsed.searchParams.set('utm_source', params.platform);
  parsed.searchParams.set('utm_medium', 'social');
  parsed.searchParams.set('utm_campaign', params.postType);
  parsed.searchParams.set('utm_content', params.listingId);
  return parsed.toString();
}
