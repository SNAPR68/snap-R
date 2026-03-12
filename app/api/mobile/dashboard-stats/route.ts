/**
 * GET /api/mobile/dashboard-stats
 * Returns aggregate stats for the mobile dashboard home screen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClientFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Count listings
  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Count photos across all user listings
  const { count: totalPhotos } = await supabase
    .from('photos')
    .select('*, listings!inner(user_id)', { count: 'exact', head: true })
    .eq('listings.user_id', user.id);

  // Count published posts
  const { count: publishedPosts } = await supabase
    .from('published_posts')
    .select('*, scheduled_posts!inner(*, listings!inner(user_id))', {
      count: 'exact',
      head: true,
    })
    .eq('scheduled_posts.listings.user_id', user.id);

  return NextResponse.json({
    totalListings: totalListings ?? 0,
    totalPhotos: totalPhotos ?? 0,
    publishedPosts: publishedPosts ?? 0,
  });
}
