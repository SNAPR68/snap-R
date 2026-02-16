/**
 * Phase 2: Marketing Automation Handler
 *
 * Runs after preparation completes. Generates marketing artifacts:
 * 1. MLS listing description (GPT-4o)
 * 2. Social media captions per platform (GPT-4o-mini)
 * 3. MLS photo manifest (no AI — metadata only)
 * 4. Property site draft (no AI — DB insert)
 *
 * Each step is independent. If one fails, others still run.
 * Same always-complete semantics as Phase 1.
 */

import type { MarketingJobMessage, Env } from './types.js';

// Cost estimates in cents for marketing steps
const MARKETING_COST_CENTS = {
  description: 15,    // GPT-4o vision + generation
  captionPerPlatform: 3,  // GPT-4o-mini per platform
  mls: 0,             // No AI
  propertySite: 0,    // No AI
};

interface MarketingStepResult {
  status: 'completed' | 'failed' | 'skipped';
  durationMs: number;
  costCents: number;
  error?: string;
}

interface MarketingCostBreakdown {
  description: MarketingStepResult;
  captions: MarketingStepResult;
  mls: MarketingStepResult;
  propertySite: MarketingStepResult;
  totalCostCents: number;
  totalDurationMs: number;
}

export async function handleMarketingJob(
  message: MarketingJobMessage,
  env: Env
): Promise<void> {
  const { jobId, listingId, userId } = message;
  const jobStart = Date.now();

  console.log(`[Marketing] Starting job ${jobId} for listing ${listingId}`);

  // Load dependencies
  const { createSupabaseClient } = await import('./lib/supabase-client.js');
  const supabase = createSupabaseClient(env);

  // Update job status → processing
  await supabase
    .from('marketing_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  // Load listing data
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, title, address, description, hero_photo_id, preparation_metadata')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    console.error(`[Marketing] Failed to load listing ${listingId}:`, listingError);
    await markJobFailed(supabase, jobId, `Failed to load listing: ${listingError?.message}`);
    return;
  }

  // Load processed photos (completed ones with processed_url)
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('id, raw_url, processed_url, status, variant')
    .eq('listing_id', listingId)
    .eq('status', 'completed')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(50);

  if (photosError || !photos || photos.length === 0) {
    console.error(`[Marketing] No processed photos for listing ${listingId}`);
    await markJobFailed(supabase, jobId, 'No processed photos available');
    return;
  }

  // Photo URLs for AI processing (prefer processed, fall back to raw)
  const photoUrls = photos.map(p => p.processed_url || p.raw_url).filter(Boolean);

  // Create OpenAI client from worker env (DI — same pattern as preparation)
  const { default: OpenAI } = await import('openai');
  const openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const costBreakdown: MarketingCostBreakdown = {
    description: { status: 'skipped', durationMs: 0, costCents: 0 },
    captions: { status: 'skipped', durationMs: 0, costCents: 0 },
    mls: { status: 'skipped', durationMs: 0, costCents: 0 },
    propertySite: { status: 'skipped', durationMs: 0, costCents: 0 },
    totalCostCents: 0,
    totalDurationMs: 0,
  };

  // Parse address components from listing
  const addressParts = parseAddress(listing.address || '');

  // =============================================
  // STEP 1: Generate MLS Description
  // =============================================
  await updateStepStatus(supabase, jobId, 'description_status', 'processing');
  const descStart = Date.now();
  try {
    const { generateListingDescription } = await import(
      '../../../lib/ai/description-generator.js'
    );

    const descriptionResult = await generateListingDescription(
      photoUrls,
      {
        title: listing.title || undefined,
        address: listing.address || undefined,
        city: addressParts.city,
        state: addressParts.state,
      },
      'professional',
      'medium',
      openaiClient
    );

    const descMs = Date.now() - descStart;
    costBreakdown.description = {
      status: 'completed',
      durationMs: descMs,
      costCents: MARKETING_COST_CENTS.description,
    };
    costBreakdown.totalCostCents += MARKETING_COST_CENTS.description;

    await supabase
      .from('marketing_jobs')
      .update({
        description_status: 'completed',
        description_result: descriptionResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[Marketing] Description generated (${descMs}ms)`);
  } catch (error) {
    const descMs = Date.now() - descStart;
    costBreakdown.description = {
      status: 'failed',
      durationMs: descMs,
      costCents: 0,
      error: String(error),
    };
    await updateStepStatus(supabase, jobId, 'description_status', 'failed');
    console.error(`[Marketing] Description generation failed:`, error);
  }

  // =============================================
  // STEP 2: Generate Social Captions
  // =============================================
  await updateStepStatus(supabase, jobId, 'captions_status', 'processing');
  const captionsStart = Date.now();
  try {
    const { generateCaption, generateHashtags } = await import(
      '../../../lib/ai/providers/gpt-copy.js'
    );

    const platforms = ['instagram', 'facebook', 'linkedin'] as const;
    const captionsResult: Record<string, unknown> = {};
    let captionCost = 0;

    for (const platform of platforms) {
      try {
        const caption = await generateCaption(
          {
            address: listing.address || undefined,
            city: addressParts.city,
            state: addressParts.state,
            propertyType: 'residential',
          },
          {
            platform,
            tone: 'professional',
            includeEmojis: true,
            includeCallToAction: true,
            contentType: 'just_listed',
          },
          openaiClient
        );

        const hashtags = await generateHashtags(
          {
            address: listing.address || undefined,
            city: addressParts.city,
            state: addressParts.state,
          },
          platform,
          15,
          openaiClient
        );

        captionsResult[platform] = {
          caption: caption.text,
          hashtags: hashtags.text,
          model: caption.model,
        };

        captionCost += MARKETING_COST_CENTS.captionPerPlatform;
      } catch (platformError) {
        captionsResult[platform] = {
          error: String(platformError),
          caption: null,
        };
        console.error(`[Marketing] Caption for ${platform} failed:`, platformError);
      }
    }

    const captionsMs = Date.now() - captionsStart;
    costBreakdown.captions = {
      status: 'completed',
      durationMs: captionsMs,
      costCents: captionCost,
    };
    costBreakdown.totalCostCents += captionCost;

    await supabase
      .from('marketing_jobs')
      .update({
        captions_status: 'completed',
        captions_result: captionsResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[Marketing] Captions generated for ${platforms.length} platforms (${captionsMs}ms)`);
  } catch (error) {
    const captionsMs = Date.now() - captionsStart;
    costBreakdown.captions = {
      status: 'failed',
      durationMs: captionsMs,
      costCents: 0,
      error: String(error),
    };
    await updateStepStatus(supabase, jobId, 'captions_status', 'failed');
    console.error(`[Marketing] Caption generation failed:`, error);
  }

  // =============================================
  // STEP 3: MLS Photo Manifest (no AI)
  // =============================================
  await updateStepStatus(supabase, jobId, 'mls_status', 'processing');
  const mlsStart = Date.now();
  try {
    // Build manifest from processed photos — ordering + naming
    const mlsManifest = photos
      .filter(p => p.processed_url)
      .map((photo, idx) => {
        const prefix = (listing.address || 'listing')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 30);
        return {
          photoId: photo.id,
          processedUrl: photo.processed_url,
          filename: `${prefix}_${String(idx + 1).padStart(2, '0')}.jpg`,
          order: idx + 1,
        };
      });

    const mlsMs = Date.now() - mlsStart;
    costBreakdown.mls = {
      status: 'completed',
      durationMs: mlsMs,
      costCents: 0,
    };

    await supabase
      .from('marketing_jobs')
      .update({
        mls_status: 'completed',
        mls_result: {
          photoCount: mlsManifest.length,
          manifest: mlsManifest,
          // Note: actual ZIP is generated on-demand via /api/marketing/mls-export
          // because sharp+archiver cannot run in Cloudflare Worker
          zipAvailable: false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[Marketing] MLS manifest: ${mlsManifest.length} photos (${mlsMs}ms)`);
  } catch (error) {
    const mlsMs = Date.now() - mlsStart;
    costBreakdown.mls = {
      status: 'failed',
      durationMs: mlsMs,
      costCents: 0,
      error: String(error),
    };
    await updateStepStatus(supabase, jobId, 'mls_status', 'failed');
    console.error(`[Marketing] MLS manifest failed:`, error);
  }

  // =============================================
  // STEP 4: Property Site Draft (no AI)
  // =============================================
  await updateStepStatus(supabase, jobId, 'property_site_status', 'processing');
  const siteStart = Date.now();
  try {
    // Generate slug from address
    const slug = generateSlug(listing.address || listing.title || listingId);

    // Check if a property site already exists for this listing
    const { data: existingSite } = await supabase
      .from('property_sites')
      .select('id, slug')
      .eq('listing_id', listingId)
      .maybeSingle();

    let siteResult;

    if (existingSite) {
      // Site already exists — just reference it
      siteResult = {
        siteId: existingSite.id,
        slug: existingSite.slug,
        created: false,
        message: 'Property site already exists',
      };
    } else {
      // Create new draft property site
      const { data: newSite, error: siteError } = await supabase
        .from('property_sites')
        .insert({
          user_id: userId,
          listing_id: listingId,
          slug,
          template: 'modern',
          is_published: false, // Draft — user publishes manually
        })
        .select('id, slug')
        .single();

      if (siteError) {
        throw new Error(`Failed to create property site: ${siteError.message}`);
      }

      siteResult = {
        siteId: newSite.id,
        slug: newSite.slug,
        created: true,
      };
    }

    const siteMs = Date.now() - siteStart;
    costBreakdown.propertySite = {
      status: 'completed',
      durationMs: siteMs,
      costCents: 0,
    };

    await supabase
      .from('marketing_jobs')
      .update({
        property_site_status: 'completed',
        property_site_result: siteResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[Marketing] Property site ${siteResult.created ? 'created' : 'exists'}: ${siteResult.slug} (${siteMs}ms)`);
  } catch (error) {
    const siteMs = Date.now() - siteStart;
    costBreakdown.propertySite = {
      status: 'failed',
      durationMs: siteMs,
      costCents: 0,
      error: String(error),
    };
    await updateStepStatus(supabase, jobId, 'property_site_status', 'failed');
    console.error(`[Marketing] Property site creation failed:`, error);
  }

  // =============================================
  // FINALIZE: Update job status + cost
  // =============================================
  const totalMs = Date.now() - jobStart;
  costBreakdown.totalDurationMs = totalMs;

  const anyStepCompleted =
    costBreakdown.description.status === 'completed' ||
    costBreakdown.captions.status === 'completed' ||
    costBreakdown.mls.status === 'completed' ||
    costBreakdown.propertySite.status === 'completed';

  const allStepsFailed =
    costBreakdown.description.status === 'failed' &&
    costBreakdown.captions.status === 'failed' &&
    costBreakdown.mls.status === 'failed' &&
    costBreakdown.propertySite.status === 'failed';

  const finalStatus = allStepsFailed ? 'failed' : 'completed';

  await supabase
    .from('marketing_jobs')
    .update({
      status: finalStatus,
      total_cost_cents: costBreakdown.totalCostCents,
      cost_breakdown: costBreakdown,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(allStepsFailed && { error: 'All marketing steps failed' }),
    })
    .eq('id', jobId);

  console.log(
    `[Marketing] Job ${jobId} ${finalStatus} — cost: $${(costBreakdown.totalCostCents / 100).toFixed(2)}, duration: ${totalMs}ms`
  );
}

// ============================================
// HELPERS
// ============================================

async function updateStepStatus(
  supabase: ReturnType<typeof import('./lib/supabase-client.js').createSupabaseClient>,
  jobId: string,
  column: string,
  status: string
): Promise<void> {
  await supabase
    .from('marketing_jobs')
    .update({
      [column]: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

async function markJobFailed(
  supabase: ReturnType<typeof import('./lib/supabase-client.js').createSupabaseClient>,
  jobId: string,
  error: string
): Promise<void> {
  await supabase
    .from('marketing_jobs')
    .update({
      status: 'failed',
      error,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

function parseAddress(address: string): { city?: string; state?: string } {
  // Simple address parser — extracts city/state from common formats:
  // "123 Main St, Denver, CO 80203" → { city: 'Denver', state: 'CO' }
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1];
    const stateMatch = stateZip.match(/^([A-Z]{2})/);
    return {
      city: parts[parts.length - 2],
      state: stateMatch ? stateMatch[1] : undefined,
    };
  }
  if (parts.length === 2) {
    const stateMatch = parts[1].match(/^([A-Z]{2})/);
    if (stateMatch) {
      return { state: stateMatch[1] };
    }
    return { city: parts[1] };
  }
  return {};
}

function generateSlug(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/-$/, '');

  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
