/**
 * SnapR API — ROI Analytics
 * ==========================
 * Aggregates engagement metrics, marketing costs, and lead data
 * into a unified response for the analytics dashboard.
 *
 * Data sources:
 * - published_posts  → engagement metrics (likes, comments, shares, impressions, reach)
 * - marketing_jobs   → cost tracking (total_cost_cents, cost_breakdown)
 * - property_leads   → lead attribution (utm_source, utm_campaign, status)
 *
 * Query params:
 * - from: ISO date string (default: 30 days ago)
 * - to:   ISO date string (default: now)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================
// TYPES
// ============================================

interface DailyEngagement {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  posts: number;
}

interface PlatformBreakdown {
  platform: string;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagementRate: number;
}

interface LeadSummary {
  total: number;
  bySource: Record<string, number>;
  byCampaign: Record<string, number>;
  byStatus: Record<string, number>;
  conversionRate: number;
}

interface CostSummary {
  totalCents: number;
  listingsMarketed: number;
  avgCostPerListing: number;
  costPerLead: number;
  costPerEngagement: number;
}

interface TopPost {
  id: string;
  platform: string;
  caption: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagement: number;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    // Default: last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const from = fromParam || thirtyDaysAgo.toISOString();
    const to = toParam || now.toISOString();

    // ── Fetch all three data sources in parallel ──
    const [postsResult, jobsResult, leadsResult] = await Promise.all([
      supabase
        .from('published_posts')
        .select('id, platform, post_type, caption, published_at, likes, comments, shares, impressions, reach, engagement_rate')
        .eq('user_id', user.id)
        .gte('published_at', from)
        .lte('published_at', to)
        .order('published_at', { ascending: true })
        .limit(500),

      supabase
        .from('marketing_jobs')
        .select('id, listing_id, total_cost_cents, cost_breakdown, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .limit(500),

      supabase
        .from('property_leads')
        .select('id, utm_source, utm_campaign, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to)
        .limit(500),
    ]);

    const posts = postsResult.data || [];
    const jobs = jobsResult.data || [];
    const leads = leadsResult.data || [];

    // ── 1. Daily engagement time-series ──
    const dailyMap = new Map<string, DailyEngagement>();
    for (const post of posts) {
      const date = post.published_at?.slice(0, 10) || '';
      if (!date) continue;

      const existing = dailyMap.get(date) || {
        date,
        likes: 0, comments: 0, shares: 0,
        impressions: 0, reach: 0, posts: 0,
      };

      existing.likes += post.likes || 0;
      existing.comments += post.comments || 0;
      existing.shares += post.shares || 0;
      existing.impressions += post.impressions || 0;
      existing.reach += post.reach || 0;
      existing.posts += 1;

      dailyMap.set(date, existing);
    }

    // Fill in missing dates with zeros
    const dailyEngagement: DailyEngagement[] = [];
    const startDate = new Date(from);
    const endDate = new Date(to);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      dailyEngagement.push(
        dailyMap.get(dateStr) || {
          date: dateStr,
          likes: 0, comments: 0, shares: 0,
          impressions: 0, reach: 0, posts: 0,
        }
      );
    }

    // ── 2. Platform breakdown ──
    const platformMap = new Map<string, PlatformBreakdown>();
    for (const post of posts) {
      const platform = post.platform || 'unknown';
      const existing = platformMap.get(platform) || {
        platform,
        posts: 0, likes: 0, comments: 0, shares: 0,
        impressions: 0, reach: 0, engagementRate: 0,
      };

      existing.posts += 1;
      existing.likes += post.likes || 0;
      existing.comments += post.comments || 0;
      existing.shares += post.shares || 0;
      existing.impressions += post.impressions || 0;
      existing.reach += post.reach || 0;

      platformMap.set(platform, existing);
    }

    // Calculate engagement rate per platform
    const platformBreakdown: PlatformBreakdown[] = [];
    for (const [, p] of platformMap) {
      const totalEngagement = p.likes + p.comments + p.shares;
      p.engagementRate = p.impressions > 0
        ? Math.round((totalEngagement / p.impressions) * 10000) / 100
        : 0;
      platformBreakdown.push(p);
    }

    // Sort by total engagement descending
    platformBreakdown.sort((a, b) => {
      const aTotal = a.likes + a.comments + a.shares;
      const bTotal = b.likes + b.comments + b.shares;
      return bTotal - aTotal;
    });

    // ── 3. Lead summary ──
    const leadSummary: LeadSummary = {
      total: leads.length,
      bySource: {},
      byCampaign: {},
      byStatus: {},
      conversionRate: 0,
    };

    let convertedLeads = 0;
    for (const lead of leads) {
      const source = lead.utm_source || 'direct';
      const campaign = lead.utm_campaign || 'organic';
      const status = lead.status || 'new';

      leadSummary.bySource[source] = (leadSummary.bySource[source] || 0) + 1;
      leadSummary.byCampaign[campaign] = (leadSummary.byCampaign[campaign] || 0) + 1;
      leadSummary.byStatus[status] = (leadSummary.byStatus[status] || 0) + 1;

      if (status === 'converted') convertedLeads++;
    }

    leadSummary.conversionRate = leads.length > 0
      ? Math.round((convertedLeads / leads.length) * 10000) / 100
      : 0;

    // ── 4. Cost summary ──
    const totalCostCents = jobs.reduce((sum, j) => sum + (j.total_cost_cents || 0), 0);
    const uniqueListings = new Set(jobs.map(j => j.listing_id)).size;
    const totalEngagement = posts.reduce(
      (sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0),
      0,
    );

    const costSummary: CostSummary = {
      totalCents: totalCostCents,
      listingsMarketed: uniqueListings,
      avgCostPerListing: uniqueListings > 0
        ? Math.round(totalCostCents / uniqueListings)
        : 0,
      costPerLead: leads.length > 0
        ? Math.round(totalCostCents / leads.length)
        : 0,
      costPerEngagement: totalEngagement > 0
        ? Math.round((totalCostCents / totalEngagement) * 100) / 100
        : 0,
    };

    // ── 5. Top performing posts ──
    const topPosts: TopPost[] = posts
      .map(p => ({
        id: p.id,
        platform: p.platform,
        caption: p.caption || '',
        published_at: p.published_at,
        likes: p.likes || 0,
        comments: p.comments || 0,
        shares: p.shares || 0,
        impressions: p.impressions || 0,
        engagement: (p.likes || 0) + (p.comments || 0) + (p.shares || 0),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);

    // ── 6. Totals ──
    const totals = {
      posts: posts.length,
      likes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
      comments: posts.reduce((sum, p) => sum + (p.comments || 0), 0),
      shares: posts.reduce((sum, p) => sum + (p.shares || 0), 0),
      impressions: posts.reduce((sum, p) => sum + (p.impressions || 0), 0),
      reach: posts.reduce((sum, p) => sum + (p.reach || 0), 0),
      engagement: totalEngagement,
      avgEngagementRate: posts.length > 0
        ? Math.round(
            posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0)
            / posts.length * 100
          ) / 100
        : 0,
    };

    return NextResponse.json({
      totals,
      dailyEngagement,
      platformBreakdown,
      leadSummary,
      costSummary,
      topPosts,
      dateRange: { from, to },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ROI Analytics] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
