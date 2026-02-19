/**
 * SnapR API - Publish Scheduled Posts Cron
 * =========================================
 * Runs every 15 minutes via Vercel Cron.
 * Picks up due `scheduled_posts` and publishes via platform APIs.
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
} from '@/lib/social/publish-service';
import { refreshAccessToken, type SocialPlatform } from '@/lib/social/oauth-config';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Auth check — same pattern as daily-digest
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[PublishCron] Starting scheduled post publisher...');
  const supabase = adminSupabase();
  const results = { published: 0, failed: 0, skipped: 0 };

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
          if (expiresAt < buffer24h && connection.refresh_token) {
            try {
              console.log(`[PublishCron] Token expiring soon for ${post.platform}, refreshing...`);
              const refreshed = await refreshAccessToken(
                post.platform as SocialPlatform,
                connection.refresh_token
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
            } catch (refreshErr: any) {
              console.error(`[PublishCron] Token refresh failed for ${post.platform}:`, refreshErr.message);
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

        // Prepare content
        const content = {
          text: post.content,
          imageUrls: post.image_urls || [],
        };

        let publishResult;

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

          default: {
            await markPostFailed(supabase, post.id, `Platform ${post.platform} not yet supported`);
            results.skipped++;
            continue;
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

          console.log(`[PublishCron] Published ${post.platform} post ${post.id} → ${publishResult.postId}`);
          results.published++;
        } else {
          await markPostFailed(supabase, post.id, publishResult.error || 'Unknown publish error');
          results.failed++;
        }

      } catch (postError: any) {
        console.error(`[PublishCron] Error publishing post ${post.id}:`, postError.message);
        await markPostFailed(supabase, post.id, postError.message);
        results.failed++;
      }
    }

    console.log('[PublishCron] Complete:', results);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('[PublishCron] Fatal error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
