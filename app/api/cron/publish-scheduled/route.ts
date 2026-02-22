/**
 * SnapR API - Publish Scheduled Posts Cron
 * =========================================
 * Runs every 15 minutes via Vercel Cron.
 * Picks up due `scheduled_posts` and publishes via platform APIs.
 * Supports both image posts and video posts (from marketing pipeline Step 6).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { getPlanLimits } from '@/lib/content/limits';
import {
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  publishVideoToTikTok,
  publishPhotoToTikTok,
} from '@/lib/social/publish-service';
import { refreshAccessToken, type SocialPlatform } from '@/lib/social/oauth-config';

const CRON_SECRET = process.env.CRON_SECRET;

interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Auth check — same pattern as daily-digest
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[PublishCron] Starting scheduled post publisher...');
  const supabase = adminSupabase();
  const results = { published: 0, failed: 0, skipped: 0 };

  // ── Video URL backfill ──────────────────────────────────────────
  // Marketing Step 6 fires-and-forgets video renders to Remotion Lambda.
  // The render completes async and video_render_jobs.video_url gets set
  // by the /api/video/status polling endpoint. This backfill links
  // completed video URLs to their pending scheduled posts.
  try {
    const { data: pendingPosts } = await supabase
      .from('scheduled_posts')
      .select('id, listing_id')
      .is('video_url', null)
      .eq('status', 'pending');

    if (pendingPosts && pendingPosts.length > 0) {
      const listingIds = [...new Set(pendingPosts.map((p: { listing_id: string }) => p.listing_id).filter(Boolean))];
      if (listingIds.length > 0) {
        const { data: completedVideos } = await supabase
          .from('video_render_jobs')
          .select('listing_id, video_url')
          .in('listing_id', listingIds)
          .eq('status', 'completed')
          .not('video_url', 'is', null);

        if (completedVideos && completedVideos.length > 0) {
          const videoMap = new Map(completedVideos.map((v: { listing_id: string; video_url: string }) => [v.listing_id, v.video_url]));
          let backfilled = 0;
          for (const post of pendingPosts) {
            const videoUrl = videoMap.get(post.listing_id);
            if (videoUrl) {
              await supabase
                .from('scheduled_posts')
                .update({ video_url: videoUrl })
                .eq('id', post.id);
              backfilled++;
            }
          }
          if (backfilled > 0) {
            console.log(`[PublishCron] Backfilled video_url for ${backfilled} scheduled post(s)`);
          }
        }
      }
    }
  } catch (backfillError: unknown) {
    // Non-critical — log and continue with publishing
    console.warn('[PublishCron] Video URL backfill error:', backfillError instanceof Error ? backfillError.message : backfillError);
  }

  try {
    // Fetch due posts: scheduled_for <= now AND status = 'pending'
    const { data: duePosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[PublishCron] Failed to fetch scheduled posts:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      console.log('[PublishCron] No due posts found');
      return NextResponse.json({ success: true, results, message: 'No due posts' });
    }

    console.log(`[PublishCron] Found ${duePosts.length} due post(s)`);

    for (const post of duePosts) {
      try {
        // Load the social connection for this user + platform
        const { data: connection, error: connError } = await supabase
          .from('social_connections')
          .select('id, platform, access_token, refresh_token, expires_at, default_page_id, instagram_account, linkedin_urn, pages')
          .eq('user_id', post.user_id)
          .eq('platform', post.platform)
          .eq('is_active', true)
          .maybeSingle();

        if (connError || !connection) {
          console.error(`[PublishCron] No active connection for ${post.platform} (user: ${post.user_id})`);
          await markPostFailed(supabase, post.id, 'Platform disconnected — no active social connection');
          results.failed++;
          continue;
        }

        // Token refresh: check if token expires within 24 hours
        if (connection.expires_at) {
          const expiresAt = new Date(connection.expires_at).getTime();
          const buffer24h = Date.now() + 24 * 60 * 60 * 1000;
          // Facebook/Instagram: pass access_token (fb_exchange_token grant)
          // Others: pass refresh_token (standard refresh_token grant)
          const isFbFamily = post.platform === 'facebook' || post.platform === 'instagram';
          const tokenToRefresh = isFbFamily ? connection.access_token : connection.refresh_token;
          if (expiresAt < buffer24h && tokenToRefresh) {
            try {
              console.log(`[PublishCron] Token expiring soon for ${post.platform}, refreshing...`);
              const refreshed = await refreshAccessToken(
                post.platform as SocialPlatform,
                tokenToRefresh
              );
              // Update the connection in DB
              const newExpiresAt = refreshed.expiresIn
                ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
                : null;
              await supabase
                .from('social_connections')
                .update({
                  access_token: refreshed.accessToken,
                  ...(newExpiresAt ? { expires_at: newExpiresAt } : {}),
                })
                .eq('id', connection.id);
              // Update in-memory connection for this publish cycle
              connection.access_token = refreshed.accessToken;
              console.log(`[PublishCron] Token refreshed for ${post.platform}`);
            } catch (refreshErr: unknown) {
              const refreshMsg = refreshErr instanceof Error ? refreshErr.message : 'Unknown refresh error';
              console.error(`[PublishCron] Token refresh failed for ${post.platform}:`, refreshMsg);
              await markPostFailed(supabase, post.id, 'Token expired — please reconnect your account');
              results.failed++;
              continue;
            }
          } else if (expiresAt < Date.now()) {
            // Token already expired and no refresh token available
            await markPostFailed(supabase, post.id, 'Token expired — please reconnect your account');
            results.failed++;
            continue;
          }
        }

        // Billing gate: check if user's plan allows auto-publishing
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', post.user_id)
          .single();

        const planLimits = getPlanLimits(profile?.subscription_tier || 'free');
        if (!planLimits.canPublish) {
          await markPostFailed(supabase, post.id, 'Upgrade to Pro to auto-publish');
          results.skipped++;
          continue;
        }

        // Determine if this is a video post or image post
        const videoUrl = post.video_url as string | null;
        const isVideoPost = !!videoUrl;

        // Prepare content
        const content = {
          text: post.content,
          imageUrls: post.image_urls || [],
          videoUrl: videoUrl ?? undefined,
        };

        let publishResult: PublishResult;

        if (isVideoPost) {
          // === VIDEO PUBLISHING ===
          publishResult = await publishVideoPost(
            post.platform,
            connection,
            content,
            supabase,
            post.id,
            results
          );

          // publishVideoPost returns a sentinel result if it handled the error internally
          if (!publishResult) continue;
        } else {
          // === IMAGE PUBLISHING ===
          switch (post.platform) {
            case 'facebook': {
              // Get page access token from pages array
              const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
              const page = pages.find((p: { id: string }) => p.id === connection.default_page_id) || pages[0];

              if (!page?.access_token || !page?.id) {
                await markPostFailed(supabase, post.id, 'No Facebook page configured');
                results.failed++;
                continue;
              }

              publishResult = await publishToFacebook(
                page.access_token,
                page.id,
                content
              );
              break;
            }

            case 'instagram': {
              const igAccount = connection.instagram_account as { id?: string } | null;
              const igAccountId = igAccount?.id;

              if (!igAccountId) {
                await markPostFailed(supabase, post.id, 'No Instagram business account linked');
                results.failed++;
                continue;
              }

              // Instagram needs the page access token (via Facebook Graph API)
              const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
              const page = pages.find((p: { id: string }) => p.id === connection.default_page_id) || pages[0];
              const accessToken = page?.access_token || connection.access_token;

              publishResult = await publishToInstagram(
                accessToken,
                igAccountId,
                content
              );
              break;
            }

            case 'linkedin': {
              const personUrn = connection.linkedin_urn;

              if (!personUrn) {
                await markPostFailed(supabase, post.id, 'No LinkedIn person URN');
                results.failed++;
                continue;
              }

              publishResult = await publishToLinkedIn(
                connection.access_token,
                personUrn,
                content
              );
              break;
            }

            case 'tiktok': {
              if (!content.imageUrls?.length) {
                await markPostFailed(supabase, post.id, 'TikTok requires images or video');
                results.failed++;
                continue;
              }

              publishResult = await publishPhotoToTikTok(
                connection.access_token,
                content.imageUrls,
                content.text
              );
              break;
            }

            default: {
              await markPostFailed(supabase, post.id, `Platform ${post.platform} not yet supported`);
              results.skipped++;
              continue;
            }
          }
        }

        // Handle publish result
        if (publishResult.success) {
          const publishedAt = new Date().toISOString();

          await supabase
            .from('scheduled_posts')
            .update({
              status: 'published',
              published_at: publishedAt,
              platform_post_id: publishResult.postId || null,
            })
            .eq('id', post.id);

          // Bridge to published_posts for analytics tracking
          await supabase
            .from('published_posts')
            .insert({
              user_id: post.user_id,
              listing_id: post.listing_id,
              platform: post.platform,
              platform_post_id: publishResult.postId || null,
              post_type: post.post_type,
              image_url: post.image_urls?.[0] || null,
              caption: post.content,
              published_at: publishedAt,
            });

          console.log(`[PublishCron] Published ${post.platform} ${isVideoPost ? 'video' : 'post'} ${post.id} → ${publishResult.postId}`);
          results.published++;
        } else {
          await markPostFailed(supabase, post.id, publishResult.error || 'Unknown publish error');
          results.failed++;
        }

      } catch (postError: unknown) {
        const postMsg = postError instanceof Error ? postError.message : 'Unknown error';
        console.error(`[PublishCron] Error publishing post ${post.id}:`, postMsg);
        await markPostFailed(supabase, post.id, postMsg);
        results.failed++;
      }
    }

    console.log('[PublishCron] Complete:', results);
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PublishCron] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
// VIDEO PUBLISHING HELPERS
// ============================================

interface ConnectionData {
  access_token: string;
  default_page_id: string | null;
  instagram_account: unknown;
  linkedin_urn: string | null;
  pages: unknown;
}

/**
 * Publish a video post to a social platform.
 * Facebook: Upload via Page Videos API
 * Instagram: Create Reels container → poll → publish
 * LinkedIn: Not yet supported (returns 501-equivalent failure)
 */
async function publishVideoPost(
  platform: string,
  connection: ConnectionData,
  content: { text: string; videoUrl?: string },
  supabase: ReturnType<typeof adminSupabase>,
  postId: string,
  results: { published: number; failed: number; skipped: number }
): Promise<PublishResult> {
  const videoUrl = content.videoUrl;

  if (!videoUrl) {
    await markPostFailed(supabase, postId, 'Video URL missing from scheduled post');
    results.failed++;
    return { success: false, error: 'Video URL missing' };
  }

  switch (platform) {
    case 'facebook': {
      const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
      const page = pages.find((p: { id: string }) => p.id === connection.default_page_id) || pages[0];

      if (!page?.access_token || !page?.id) {
        await markPostFailed(supabase, postId, 'No Facebook page configured');
        results.failed++;
        return { success: false, error: 'No Facebook page' };
      }

      return publishVideoToFacebook(page.access_token, page.id, videoUrl, content.text);
    }

    case 'instagram': {
      const igAccount = connection.instagram_account as { id?: string } | null;
      const igAccountId = igAccount?.id;

      if (!igAccountId) {
        await markPostFailed(supabase, postId, 'No Instagram business account linked');
        results.failed++;
        return { success: false, error: 'No Instagram account' };
      }

      const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
      const page = pages.find((p: { id: string }) => p.id === connection.default_page_id) || pages[0];
      const accessToken = page?.access_token || connection.access_token;

      return publishVideoToInstagram(accessToken, igAccountId, videoUrl, content.text);
    }

    case 'linkedin': {
      // LinkedIn video publishing requires registerUpload → upload binary → create post
      // Complex flow — defer to future phase
      return { success: false, error: 'LinkedIn video publishing coming soon' };
    }

    case 'tiktok': {
      return publishVideoToTikTok(connection.access_token, videoUrl, content.text);
    }

    default:
      return { success: false, error: `Video publishing not supported for ${platform}` };
  }
}

/**
 * Facebook Video Publishing via Graph API /videos endpoint
 */
async function publishVideoToFacebook(
  pageAccessToken: string,
  pageId: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/videos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: pageAccessToken,
          file_url: videoUrl,
          description: caption,
          published: true,
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    const result = await response.json();

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return {
      success: true,
      postId: result.id,
      postUrl: `https://facebook.com/${result.id}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Facebook video error';
    console.error('[PublishCron] Facebook video error:', message);
    return { success: false, error: message };
  }
}

/**
 * Instagram Reels Publishing via Graph API
 * 3-step: create container → poll status → publish
 */
async function publishVideoToInstagram(
  accessToken: string,
  igAccountId: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    // Step 1: Create Reels container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          media_type: 'REELS',
          video_url: videoUrl,
          caption,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const container = await containerResponse.json();

    if (container.error) {
      return { success: false, error: container.error.message };
    }

    // Step 2: Poll for video processing completion
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 30 × 2s = 60s max wait

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));

      const statusResponse = await fetch(
        `https://graph.facebook.com/v18.0/${container.id}?fields=status_code&access_token=${accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const statusData = await statusResponse.json();
      status = statusData.status_code;
      attempts++;
    }

    if (status !== 'FINISHED') {
      return { success: false, error: `Video processing ${status === 'ERROR' ? 'failed' : 'timed out'}` };
    }

    // Step 3: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          creation_id: container.id,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://instagram.com/reel/${publishData.id}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Instagram video error';
    console.error('[PublishCron] Instagram video error:', message);
    return { success: false, error: message };
  }
}

// Helper: mark a scheduled post as failed
async function markPostFailed(
  supabase: ReturnType<typeof adminSupabase>,
  postId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('scheduled_posts')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('id', postId);

  console.error(`[PublishCron] Post ${postId} failed: ${errorMessage}`);
}
