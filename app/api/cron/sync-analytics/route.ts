/**
 * SnapR API - Sync Social Analytics Cron
 * ========================================
 * Runs every 6 hours via Vercel Cron.
 * Fetches engagement metrics (likes, comments, shares, impressions, reach)
 * from Facebook, Instagram, and LinkedIn APIs for published posts.
 * Updates the `published_posts` table so the analytics dashboard shows real data.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Auth check — same pattern as daily-digest
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[AnalyticsSync] Starting social analytics sync...');
  const supabase = adminSupabase();
  const results = { synced: 0, failed: 0, skipped: 0 };

  try {
    // Fetch published posts that need syncing:
    // - Have a platform_post_id (something was actually published)
    // - Haven't been synced in the last hour (or never synced)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: postsToSync, error: fetchError } = await supabase
      .from('published_posts')
      .select('id, user_id, platform, platform_post_id')
      .not('platform_post_id', 'is', null)
      .or(`last_synced_at.is.null,last_synced_at.lt.${oneHourAgo}`)
      .order('published_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('[AnalyticsSync] Failed to fetch posts:', fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!postsToSync || postsToSync.length === 0) {
      console.log('[AnalyticsSync] No posts need syncing');
      return NextResponse.json({ success: true, results, message: 'Nothing to sync' });
    }

    console.log(`[AnalyticsSync] Syncing ${postsToSync.length} post(s)`);

    // Group posts by user_id to batch connection lookups
    const userIds = [...new Set(postsToSync.map(p => p.user_id))];

    // Load all relevant social connections at once
    const { data: connections } = await supabase
      .from('social_connections')
      .select('user_id, platform, access_token, default_page_id, pages, instagram_account, linkedin_urn')
      .in('user_id', userIds)
      .eq('is_active', true);

    const connectionMap = new Map<string, typeof connections>();
    for (const conn of connections || []) {
      const key = `${conn.user_id}:${conn.platform}`;
      connectionMap.set(key, conn as any);
    }

    for (const post of postsToSync) {
      try {
        const connKey = `${post.user_id}:${post.platform}`;
        const connection = connectionMap.get(connKey) as any;

        if (!connection) {
          results.skipped++;
          continue;
        }

        let metrics: { likes: number; comments: number; shares: number; impressions: number; reach: number } | null = null;

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
      } catch (postError: any) {
        console.error(`[AnalyticsSync] Error syncing post ${post.id}:`, postError.message);
        results.failed++;
      }
    }

    console.log('[AnalyticsSync] Complete:', results);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('[AnalyticsSync] Fatal error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  connection: { pages: any; default_page_id: string },
  postId: string
): Promise<Metrics | null> {
  try {
    const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
    const page = pages.find(p => p.id === connection.default_page_id) || pages[0];
    if (!page?.access_token) return null;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${page.access_token}`
    );

    if (!response.ok) {
      console.error(`[AnalyticsSync] Facebook API error for ${postId}:`, response.status);
      return null;
    }

    const data = await response.json();

    return {
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      impressions: 0, // Requires page insights API (separate endpoint)
      reach: 0,       // Requires page insights API (separate endpoint)
    };
  } catch (error) {
    console.error('[AnalyticsSync] Facebook fetch error:', error);
    return null;
  }
}

async function fetchInstagramMetrics(
  connection: { instagram_account: any; pages: any; default_page_id: string; access_token: string },
  mediaId: string
): Promise<Metrics | null> {
  try {
    const pages = (connection.pages || []) as Array<{ id: string; access_token: string }>;
    const page = pages.find(p => p.id === connection.default_page_id) || pages[0];
    const accessToken = page?.access_token || connection.access_token;

    // Fetch basic media fields
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`
    );

    let likes = 0;
    let comments = 0;

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      likes = mediaData.like_count || 0;
      comments = mediaData.comments_count || 0;
    }

    // Fetch insights (impressions, reach)
    let impressions = 0;
    let reach = 0;

    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=impressions,reach&access_token=${accessToken}`
    );

    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      for (const metric of insightsData.data || []) {
        if (metric.name === 'impressions') impressions = metric.values?.[0]?.value || 0;
        if (metric.name === 'reach') reach = metric.values?.[0]?.value || 0;
      }
    }

    return { likes, comments, shares: 0, impressions, reach };
  } catch (error) {
    console.error('[AnalyticsSync] Instagram fetch error:', error);
    return null;
  }
}

async function fetchLinkedInMetrics(
  connection: { access_token: string; linkedin_urn: string },
  postUrn: string
): Promise<Metrics | null> {
  try {
    // LinkedIn socialActions endpoint
    const response = await fetch(
      `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}?count=0`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`[AnalyticsSync] LinkedIn API error for ${postUrn}:`, response.status);
      return null;
    }

    const data = await response.json();

    return {
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
      shares: 0, // LinkedIn doesn't expose share count via this endpoint
      impressions: 0, // Requires organization analytics (separate API)
      reach: 0,
    };
  } catch (error) {
    console.error('[AnalyticsSync] LinkedIn fetch error:', error);
    return null;
  }
}
