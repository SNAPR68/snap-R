// Shared utility functions for print material PDF generation

import QRCode from 'qrcode';

/**
 * Generate a QR code as a base64 PNG data URI
 */
export async function generateQrCodeDataUri(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Fetch an image URL and return as a base64 data URI.
 * Pattern follows /api/download-all/route.ts image fetching.
 */
export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Format a price for display.
 */
export function formatPrice(price: number | null): string {
  if (!price) return 'Price Upon Request';
  return `$${Number(price).toLocaleString()}`;
}

/**
 * Format a full address from listing parts.
 */
export function formatAddress(listing: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
}): string {
  const parts = [listing.address];
  const cityState = [listing.city, listing.state].filter(Boolean).join(', ');
  if (cityState) parts.push(cityState);
  if (listing.postal_code) parts.push(listing.postal_code);
  return parts.filter(Boolean).join(', ');
}

/**
 * Format a property type slug into a display label.
 */
export function formatPropertyType(type: string | null): string {
  if (!type) return 'Residential';
  const labels: Record<string, string> = {
    single_family: 'Single Family',
    condo: 'Condominium',
    townhouse: 'Townhouse',
    multi_family: 'Multi-Family',
    land: 'Land',
    commercial: 'Commercial',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
