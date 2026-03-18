/**
 * SnapR API - MLS Auto-Sync Cron
 * ================================
 * Runs every 6 hours via Vercel Cron.
 * For each user with MLS sync enabled, pulls active listings from their
 * configured MLS provider and creates/updates listings in SnapR.
 *
 * - New MLS listings → auto-create listing row
 * - Price changes → update listing + flag for marketing re-trigger
 * - Status changes (Active→Pending→Sold) → update listing status
 * - Duplicate detection via mls_number unique index
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { getMLSProvider } from '@/lib/mls/provider';
import type { MLSPropertyData, MLSCredentials } from '@/lib/mls/types';
import { logger } from '@/lib/logger';
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat';
import { z } from 'zod';

const CRON_SECRET = process.env.CRON_SECRET;

const mlsSyncConfigSchema = z.object({
  mls_provider: z.string(),
  mls_username: z.string(),
  mls_password: z.string(),
  mls_search_city: z.string().optional(),
  mls_search_state: z.string().optional(),
  mls_search_postal_code: z.string().optional(),
  mls_sync_enabled: z.boolean(),
});

type MLSSyncConfig = z.infer<typeof mlsSyncConfigSchema>;

interface ListingRow {
  id: string;
  mls_number: string | null;
  price: number | null;
  listing_status: string | null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[MLSSync] Starting MLS auto-sync...');
  const heartbeat = startCronHeartbeat('mls-sync');
  const supabase = adminSupabase();
  const results = { usersProcessed: 0, listingsCreated: 0, listingsUpdated: 0, errors: 0 };

  try {
    // Fetch all users with MLS sync enabled
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, mls_sync_config')
      .not('mls_sync_config', 'is', null);

    if (profileError) {
      logger.error('[MLSSync] Failed to fetch profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    const syncUsers: { id: string; mls_sync_config: MLSSyncConfig }[] = [];
    for (const p of profiles ?? []) {
      const parsed = mlsSyncConfigSchema.safeParse(p.mls_sync_config);
      if (parsed.success && parsed.data.mls_sync_enabled) {
        syncUsers.push({ id: p.id, mls_sync_config: parsed.data });
      } else if (!parsed.success) {
        logger.warn(`[MLSSync] Invalid mls_sync_config for user ${p.id}:`, parsed.error.message);
      }
    }

    if (syncUsers.length === 0) {
      logger.info('[MLSSync] No users with MLS sync enabled');
      return NextResponse.json({ message: 'No users to sync', ...results });
    }

    for (const profile of syncUsers) {
      const config = profile.mls_sync_config;
      if (!config) continue;

      try {
        await syncUserListings(supabase, profile.id, config, results);
        results.usersProcessed++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[MLSSync] Error syncing user ${profile.id}:`, msg);
        results.errors++;
      }
    }

    logger.info('[MLSSync] Sync complete:', results);
    await heartbeat.succeed(results as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, ...results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[MLSSync] Fatal error:', msg);
    await heartbeat.fail(error instanceof Error ? error : new Error(msg));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function syncUserListings(
  supabase: ReturnType<typeof adminSupabase>,
  userId: string,
  config: MLSSyncConfig,
  results: { listingsCreated: number; listingsUpdated: number; errors: number }
) {
  const provider = getMLSProvider(config.mls_provider);

  if (!provider.searchListings) {
    logger.info(`[MLSSync] Provider ${config.mls_provider} does not support search`);
    return;
  }

  const credentials: MLSCredentials = {
    username: config.mls_username,
    password: config.mls_password,
  };

  const mlsListings = await provider.searchListings(
    {
      city: config.mls_search_city,
      state: config.mls_search_state,
      postalCode: config.mls_search_postal_code,
      status: 'Active',
      limit: 50,
    },
    credentials
  );

  if (mlsListings.length === 0) {
    logger.info(`[MLSSync] No listings found for user ${userId}`);
    return;
  }

  // Fetch existing listings by MLS number for duplicate detection
  const mlsNumbers = mlsListings.map((l) => l.mlsNumber).filter(Boolean);
  const { data: existingListings } = await supabase
    .from('listings')
    .select('id, mls_number, price, listing_status')
    .eq('user_id', userId)
    .in('mls_number', mlsNumbers);

  const existingMap = new Map<string, ListingRow>(
    (existingListings ?? []).map((l: ListingRow) => [l.mls_number ?? '', l])
  );

  for (const mlsData of mlsListings) {
    try {
      const existing = existingMap.get(mlsData.mlsNumber);

      if (existing) {
        // Update existing listing if price or status changed
        await updateExistingListing(supabase, existing, mlsData, results);
      } else {
        // Create new listing
        await createNewListing(supabase, userId, mlsData, results);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[MLSSync] Error processing MLS ${mlsData.mlsNumber}:`, msg);
      results.errors++;
    }
  }
}

async function updateExistingListing(
  supabase: ReturnType<typeof adminSupabase>,
  existing: ListingRow,
  mlsData: MLSPropertyData,
  results: { listingsUpdated: number }
) {
  const updates: Record<string, unknown> = {};
  let priceChanged = false;

  // Detect price change (including null→value transitions)
  if (mlsData.price != null && mlsData.price !== existing.price) {
    updates.price = mlsData.price;
    if (existing.price != null) {
      updates.previous_price = existing.price;
      priceChanged = true;
    }
  }

  // Detect status change
  if (mlsData.listingStatus && mlsData.listingStatus !== existing.listing_status) {
    updates.listing_status = mlsData.listingStatus;
  }

  // Always update description if available
  if (mlsData.description) {
    updates.description = mlsData.description;
  }

  updates.mls_synced_at = new Date().toISOString();

  if (Object.keys(updates).length > 1) { // more than just mls_synced_at
    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Update failed for listing ${existing.id}: ${error.message}`);
    }

    results.listingsUpdated++;

    if (priceChanged) {
      logger.info(`[MLSSync] Price change detected for ${existing.id}: $${existing.price} → $${mlsData.price}`);
    }
  }
}

async function createNewListing(
  supabase: ReturnType<typeof adminSupabase>,
  userId: string,
  mlsData: MLSPropertyData,
  results: { listingsCreated: number }
) {
  const { error } = await supabase.from('listings').insert({
    user_id: userId,
    title: mlsData.address || 'MLS Import',
    address: mlsData.address,
    city: mlsData.city,
    state: mlsData.state,
    postal_code: mlsData.postalCode,
    price: mlsData.price,
    bedrooms: mlsData.bedrooms,
    bathrooms: mlsData.bathrooms,
    square_feet: mlsData.squareFeet,
    year_built: mlsData.yearBuilt,
    lot_size: mlsData.lotSize,
    property_type: mlsData.propertyType,
    description: mlsData.description,
    parking: mlsData.parking,
    features: mlsData.features,
    hoa_fees: mlsData.hoaFees,
    latitude: mlsData.latitude,
    longitude: mlsData.longitude,
    virtual_tour_url: mlsData.virtualTourUrl,
    mls_number: mlsData.mlsNumber,
    listing_status: mlsData.listingStatus,
    mls_synced_at: new Date().toISOString(),
    preparation_status: 'draft',
    marketing_status: 'pending',
  });

  if (error) {
    throw new Error(`Insert failed for MLS ${mlsData.mlsNumber}: ${error.message}`);
  }

  results.listingsCreated++;
  logger.info(`[MLSSync] Created listing from MLS ${mlsData.mlsNumber}: ${mlsData.address}`);
}
