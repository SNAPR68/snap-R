/**
 * REST API client for SnapR Next.js backend
 * Wraps fetch calls with auth headers from Supabase session
 */

import { supabase } from './supabase';
import { API_BASE_URL } from '../constants/config';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  params?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params, timeout = 15000 } = options;

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const authHeaders = await getAuthHeaders();
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    ...authHeaders,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage: string;
      try {
        const parsed = JSON.parse(errorBody) as { error?: string; message?: string };
        errorMessage = parsed.error || parsed.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorBody || `HTTP ${response.status}`;
      }
      return { data: null, error: errorMessage, status: response.status };
    }

    const data = (await response.json()) as T;
    return { data, error: null, status: response.status };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    return { data: null, error: message, status: 0 };
  }
}

// Convenience methods
export const apiGet = <T>(path: string, params?: Record<string, string>) =>
  api<T>(path, { method: 'GET', params });

export const apiPost = <T>(path: string, body?: Record<string, unknown>) =>
  api<T>(path, { method: 'POST', body });

export const apiPut = <T>(path: string, body?: Record<string, unknown>) =>
  api<T>(path, { method: 'PUT', body });

export const apiPatch = <T>(path: string, body?: Record<string, unknown>) =>
  api<T>(path, { method: 'PATCH', body });

export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: 'DELETE' });

// --- Typed API client ---

interface ListingItem {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

interface CreateListingPayload {
  title: string;
  address?: string;
}

interface AnalyzeFrameResult {
  roomType: string;
  roomConfidence: number;
  compositionScore: number;
  lightingScore: number;
  overallScore: number;
  tips: string[];
  captureRecommended: boolean;
}

interface DashboardStats {
  totalListings: number;
  totalPhotos: number;
  publishedPosts: number;
}

interface RecentListingItem {
  id: string;
  title: string;
  address: string | null;
  preparation_status: string | null;
  photo_count: number;
}

interface FullListingItem {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  preparation_status: string | null;
  marketing_status: string | null;
  photo_count: number;
  created_at: string;
}

interface ListingDetailResponse {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  preparation_status: string | null;
  marketing_status: string | null;
  hero_photo_id: string | null;
  created_at: string;
}

interface PhotoItemResponse {
  id: string;
  raw_url: string | null;
  processed_url: string | null;
  status: string;
  variant: string;
  signed_url?: string;
}

interface MarketingResultsResponse {
  description: string | null;
  captions: Record<string, string> | null;
  mls_summary: string | null;
  property_site_url: string | null;
  scheduled_posts_count: number;
}

interface ScheduledPostItem {
  id: string;
  platform: string;
  content: string;
  scheduled_for: string;
  status: string;
  listing_title?: string;
}

interface PublishedPostItem {
  id: string;
  platform: string;
  content: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
}

interface ContentStatsResponse {
  scheduledCount: number;
  publishedCount: number;
  totalImpressions: number;
}

interface SocialConnectionItem {
  platform: string;
  display_name?: string;
}

export const apiClient = {
  /** Fetch user's listings */
  async getListings(): Promise<ListingItem[]> {
    const { data } = await apiGet<ListingItem[]>('/api/listings');
    return data ?? [];
  },

  /** Create a new listing */
  async createListing(
    payload: CreateListingPayload
  ): Promise<ListingItem | null> {
    const { data } = await apiPost<ListingItem>('/api/listings', payload as unknown as Record<string, unknown>);
    return data;
  },

  /** Analyze a camera frame via GPT-4o Vision */
  async analyzeFrame(imageUri: string): Promise<AnalyzeFrameResult | null> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'frame.jpg',
    } as unknown as Blob);

    const { data } = await api<AnalyzeFrameResult>('/api/mobile/analyze-frame', {
      method: 'POST',
      body: formData,
      timeout: 20000,
    });
    return data;
  },

  // --- Phase 3: Dashboard + Listings ---

  /** Fetch dashboard stats */
  async getDashboardStats(): Promise<DashboardStats | null> {
    const { data } = await apiGet<DashboardStats>('/api/mobile/dashboard-stats');
    return data;
  },

  /** Fetch recent listings (last 5) */
  async getRecentListings(): Promise<RecentListingItem[]> {
    const { data } = await apiGet<RecentListingItem[]>('/api/listings', { limit: '5', sort: 'newest' });
    return data ?? [];
  },

  /** Fetch all listings with photo counts */
  async getAllListings(): Promise<FullListingItem[]> {
    const { data } = await apiGet<FullListingItem[]>('/api/listings', { limit: '100' });
    return data ?? [];
  },

  /** Fetch single listing detail */
  async getListingDetail(listingId: string): Promise<ListingDetailResponse | null> {
    const { data } = await apiGet<ListingDetailResponse>(`/api/listing/status`, { listingId });
    return data;
  },

  /** Fetch photos for a listing */
  async getListingPhotos(listingId: string): Promise<PhotoItemResponse[]> {
    const { data } = await apiGet<PhotoItemResponse[]>(`/api/listings/${listingId}/photos`);
    return data ?? [];
  },

  /** Trigger listing preparation */
  async prepareListing(listingId: string): Promise<void> {
    const { error } = await apiPost('/api/listing/prepare', { listingId });
    if (error) throw new Error(error);
  },

  /** Fetch marketing results for a listing */
  async getMarketingResults(listingId: string): Promise<MarketingResultsResponse | null> {
    const { data } = await apiGet<MarketingResultsResponse>('/api/marketing/status', { listingId });
    return data;
  },

  // --- Phase 4: Content Studio + Settings ---

  /** Fetch scheduled posts */
  async getScheduledPosts(): Promise<ScheduledPostItem[]> {
    const { data } = await apiGet<ScheduledPostItem[]>('/api/schedule', { status: 'pending' });
    return data ?? [];
  },

  /** Fetch published posts with engagement */
  async getPublishedPosts(): Promise<PublishedPostItem[]> {
    const { data } = await apiGet<PublishedPostItem[]>('/api/analytics/posts');
    return data ?? [];
  },

  /** Fetch content stats summary */
  async getContentStats(): Promise<ContentStatsResponse | null> {
    const { data } = await apiGet<ContentStatsResponse>('/api/mobile/content-stats');
    return data;
  },

  /** Fetch social connections status */
  async getSocialConnections(): Promise<SocialConnectionItem[]> {
    const { data } = await apiGet<SocialConnectionItem[]>('/api/social/connections');
    return data ?? [];
  },
};
