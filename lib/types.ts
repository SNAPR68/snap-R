// TypeScript interfaces for Supabase database types

export interface Job {
  id: string;
  user_id: string | null;
  listing_id: string | null;
  variant?: string | null;
  error?: string | null;
  completed_at?: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string | null;
}

export interface Photo {
  id: string;
  listing_id: string | null;
  job_id: string | null;
  raw_url: string | null;
  processed_url: string | null;
  processed_at?: string | null;
  variant?: string | null;
  error?: string | null;
  status: string;
  room_type: string | null;
  quality_score: number | null;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string | null;
  title: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListingWithPhotos extends Listing {
  thumbnail?: string;
  count: number;
}

export interface ListingPayload {
  title: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  description?: string;
}

