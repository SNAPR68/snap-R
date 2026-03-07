/**
 * SnapR API - Sync Social Analytics Cron
 * ========================================
 * Runs every 6 hours via Vercel Cron.
 * Fetches engagement metrics (likes, comments, shares, impressions, reach)
 * from Facebook, Instagram, LinkedIn, Twitter, and TikTok APIs for published posts.
 * Updates the `published_posts` table so the analytics dashboard shows real data.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { refreshAccessToken, type SocialPlatform } from '@/lib/social/oauth-config';

import { logger } from '@/lib/logger';
const CRON_SECRET = process.env.CRON_SECRET;

interface SocialConnectionRecord {
  id: string;
  user_id: string;
  platform: string;
  access_token: string;
  token_expires_at: string | null;
  refresh_token: string | null;
  default_page_id: string | null;
  pages: Array<{ id: string; name: string; access_token: string }> | null;
  instagram_account: { id: string; username: string } | null;
  linkedin_urn: string | null;
  platform_user_id: string | null;
}

export async function GET(request: NextRequest) {
  // Auth check — same pattern as daily-digest
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[AnalyticsSync] Starting social analytics sync...');
  const supabase = adminSupabase();
  const results = { synced: 0, failed: 0, skipped: 0, tokensRefreshed: 0 };

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Paginated fetch — batch through all posts
    const batchSize = 200;
    let offset = 0;
    let postsToSync: Array<{ id: string; user_id: string; platform: string; platform_post_id: string | null }> = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: batch, error: fetchError } = await supabase
        .from('published_posts')
        .select('id, user_id, platform, platform_post_id')
        .not('platform_post_id', 'is', null)
        .or(`last_synced_at.is.null,last_synced_at.lt.${oneHourAgo}`)
        .order('published_at', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (fetchError) {
        logger.error('[AnalyticsSync] Failed to fetch posts:', fetchError.message);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      if (!batch || batch.length === 0) break;
      postsToSync = postsToSync.concat(batch);
      if (batch.length < batchSize) break;
      offset += batchSize;
    }

    if (postsToSync.length === 0) {
      return NextResponse.json({ success: true, results, message: 'Nothing to sync' });
    }

    logger.info(`[AnalyticsSync] Syncing ${postsToSync.length} post(s)`);

    const userIds = [...new Set(postsToSync.map(p => p.user_id))];

    // Load connections including token_expires_at for refresh check
    const { data: connections } = await supabase
      .from('social_connections')
      .select('id, user_id, platform, access_token, token_expires_at, refresh_token, default_page_id, pages, instagram_account, linkedin_urn, platform_user_id')
      .in('user_id', userIds)
      .eq('is_active', true);

    const connectionMap = new Map<string, SocialConnectionRecord>();
    for (const conn of (connections || []) as SocialConnectionRecord[]) {
      // Check if token needs refresh (expired or expiring within 1 hour)
      if (conn.token_expires_at) {
        const expiresAt = new Date(conn.token_expires_at).getTime();
        const oneHourFromNow = Date.now() + 60 * 60 * 1000;
        if (expiresAt < oneHourFromNow) {
          try {
            // For Facebook/Instagram, pass access_token (not refresh_token) for exchange
            const tokenToRefresh = (conn.platform === 'facebook' || conn.platform === 'instagram')
              ? conn.access_token
              : conn.refresh_token;

            if (tokenToRefresh) {
              const refreshed = await refreshAccessToken(conn.platform as SocialPlatform, tokenToRefresh);
              conn.access_token = refreshed.accessToken;

              // Update in database
              const newExpiry = refreshed.expiresIn
                ? new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()
                : undefined;

              await supabase
                .from('social_connections')
                .update({
                  access_token: refreshed.accessToken,
                  ...(newExpiry && { token_expires_at: newExpiry }),
                })
                .eq('id', conn.id);

              results.tokensRefreshed++;
              logger.info(`[AnalyticsSync] Refreshed token for ${conn.platform} user ${conn.user_id}`);
            }
          } catch (refreshErr: unknown) {
            const message = refreshErr instanceof Error ? refreshErr.message : 'Internal server error';
            logger.error(`[AnalyticsSync] Token refresh failed for ${conn.platform}:`, message);
          }
        }
      }

      const key = `${conn.user_id}:${conn.platform}`;
      connectionMap.set(key, conn);
    }

    for (const post of postsToSync) {
      try {
        const connKey = `${post.user_id}:${post.platform}`;
        const connection = connectionMap.get(connKey);

        if (!connection) {
          results.skipped++;
          continue;
        }

        let metrics: Metrics | null = null;

        switch (post.platform) {
          case 'facebook':
            metrics = await fetchFacebookMetrics(connection, post.platform_post_id!);
            break;
          case 'instagram':
            metrics = await fetchInstagramMetrics(connection, post.platform_post_id!);
            break;
          case 'linkedin':
            metrics = await fetchLinkedInMetrics(connection, post.platform_post_id!);
            break;
          case 'twitter':
            metrics = await fetchTwitterMetrics(connection, post.platform_post_id!);
            break;
          case 'tiktok':
            metrics = await fetchTikTokMetrics(connection, post.platform_post_id!);
            break;
          default:
            results.skipped++;
            continue;
        }

        if (metrics) {
          const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
          const engagementRate = metrics.impressions > 0
            ? Math.round((totalEngagement / metrics.impressions) * 10000) / 100
            : 0;

          await supabase
            .from('published_posts')
            .update({
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              impressions: metrics.impressions,
              reach: metrics.reach,
              engagement_rate: engagementRate,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', post.id);

          results.synced++;
        } else {
          results.skipped++;
        }
      } catch (postError: unknown) {
        const message = postError instanceof Error ? postError.message : 'Internal server error';
        logger.error(`[AnalyticsSync] Error syncing post ${post.id}:`, message);
        results.failed++;
      }
    }

    logger.info('[AnalyticsSync] Complete:', results);
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[AnalyticsSync] Fatal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
// PLATFORM-SPECIFIC METRIC FETCHERS
// ============================================

interface Metrics {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
}

async function fetchFacebookMetrics(
  connection: SocialConnectionRecord,
  postId: string
): Promise<Metrics | null> {
  try {
    const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
    const page = pages.find(p => p.id === connection.default_page_id) || pages[0];
    if (!page?.access_token) return null;

    // Use Authorization header instead of URL query param
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?fields=likes.summary(true),comments.summary(true),shares`,
      {
        headers: { 'Authorization': `Bearer ${page.access_token}` },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      logger.error(`[AnalyticsSync] Facebook API error for ${postId}:`, response.status);
      return null;
    }

    const data = await response.json();

    // Fetch impressions via insights endpoint (requires pages_read_engagement scope)
    let impressions = 0;
    let reach = 0;
    try {
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${postId}/insights?metric=post_impressions_unique,post_impressions&period=lifetime`,
        {
          headers: { 'Authorization': `Bearer ${page.access_token}` },
          signal: AbortSignal.timeout(15000),
        }
      );
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        for (const metric of insightsData.data || []) {
          if (metric.name === 'post_impressions') impressions = metric.values?.[0]?.value || 0;
          if (metric.name === 'post_impressions_unique') reach = metric.values?.[0]?.value || 0;
        }
      }
    } catch {
      // Gracefully fall back if pages_read_engagement scope not granted
    }

    return {
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      impressions,
      reach,
    };
  } catch (error: unknown) {
    logger.error('[AnalyticsSync] Facebook fetch error:', error);
    return null;
  }
}

async function fetchInstagramMetrics(
  connection: SocialConnectionRecord,
  mediaId: string
): Promise<Metrics | null> {
  try {
    const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
    const page = pages.find(p => p.id === connection.default_page_id) || pages[0];
    const accessToken = page?.access_token || connection.access_token;

    // Use Authorization header instead of URL query param
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}?fields=like_count,comments_count`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(15000),
      }
    );

    let likes = 0;
    let comments = 0;

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      likes = mediaData.like_count || 0;
      comments = mediaData.comments_count || 0;
    }

    let impressions = 0;
    let reach = 0;

    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      for (const metric of insightsData.data || []) {
        if (metric.name === 'impressions') impressions = metric.values?.[0]?.value || 0;
        if (metric.name === 'reach') reach = metric.values?.[0]?.value || 0;
      }
    }

    return { likes, comments, shares: 0, impressions, reach };
  } catch (error: unknown) {
    logger.error('[AnalyticsSync] Instagram fetch error:', error);
    return null;
  }
}

async function fetchLinkedInMetrics(
  connection: SocialConnectionRecord,
  postUrn: string
): Promise<Metrics | null> {
  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}?count=0`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      logger.error(`[AnalyticsSync] LinkedIn API error for ${postUrn}:`, response.status);
      return null;
    }

    const data = await response.json();

    return {
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
      shares: data.sharesSummary?.totalShares || 0,
      impressions: 0,
      reach: 0,
    };
  } catch (error: unknown) {
    logger.error('[AnalyticsSync] LinkedIn fetch error:', error);
    return null;
  }
}

async function fetchTwitterMetrics(
  connection: SocialConnectionRecord,
  tweetId: string
): Promise<Metrics | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      {
        headers: { 'Authorization': `Bearer ${connection.access_token}` },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      logger.error(`[AnalyticsSync] Twitter API error for ${tweetId}:`, response.status);
      return null;
    }

    const data = await response.json();
    const metrics = data.data?.public_metrics;
    if (!metrics) return null;

    return {
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      impressions: metrics.impression_count || 0,
      reach: 0,
    };
  } catch (error: unknown) {
    logger.error('[AnalyticsSync] Twitter fetch error:', error);
    return null;
  }
}

async function fetchTikTokMetrics(
  connection: SocialConnectionRecord,
  videoId: string
): Promise<Metrics | null> {
  try {
    const response = await fetch(
      'https://open.tiktokapis.com/v2/video/query/?fields=like_count,comment_count,share_count,view_count',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: { video_ids: [videoId] },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      logger.error(`[AnalyticsSync] TikTok API error for ${videoId}:`, response.status);
      return null;
    }

    const data = await response.json();
    const video = data.data?.videos?.[0];
    if (!video) return null;

    return {
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      impressions: video.view_count || 0,
      reach: 0,
    };
  } catch (error: unknown) {
    logger.error('[AnalyticsSync] TikTok fetch error:', error);
    return null;
  }
}
