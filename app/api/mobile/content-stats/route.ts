/**
 * GET /api/mobile/content-stats
 * Returns content studio summary stats for the mobile app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count pending scheduled posts
    const { count: scheduledCount } = await supabase
      .from('scheduled_posts')
      .select('*, listings!inner(user_id)', { count: 'exact', head: true })
      .eq('listings.user_id', user.id)
      .eq('status', 'pending');

    // Count published posts
    const { count: publishedCount } = await supabase
      .from('published_posts')
      .select('*, scheduled_posts!inner(*, listings!inner(user_id))', {
        count: 'exact',
        head: true,
      })
      .eq('scheduled_posts.listings.user_id', user.id);

    // Sum impressions from published posts
    const { data: impressionsData } = await supabase
      .from('published_posts')
      .select('impressions, scheduled_posts!inner(*, listings!inner(user_id))')
      .eq('scheduled_posts.listings.user_id', user.id);

    const totalImpressions = (impressionsData ?? []).reduce(
      (sum, row) => sum + ((row.impressions as number) ?? 0),
      0
    );

    return NextResponse.json({
      scheduledCount: scheduledCount ?? 0,
      publishedCount: publishedCount ?? 0,
      totalImpressions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Mobile/ContentStats] GET error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
