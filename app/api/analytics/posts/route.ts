import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch published posts with analytics
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const platform = url.searchParams.get('platform')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    let query = supabase
      .from('published_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (platform) query = query.eq('platform', platform)

    const { data: posts, error } = await query

    if (error) throw error

    // Calculate totals
    const totals = {
      posts: posts?.length || 0,
      likes: posts?.reduce((sum, p) => sum + (p.likes || 0), 0) || 0,
      comments: posts?.reduce((sum, p) => sum + (p.comments || 0), 0) || 0,
      shares: posts?.reduce((sum, p) => sum + (p.shares || 0), 0) || 0,
      impressions: posts?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0,
      reach: posts?.reduce((sum, p) => sum + (p.reach || 0), 0) || 0,
    }

    return NextResponse.json({ posts: posts || [], totals })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

// POST - Record a published post
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { listingId, platform, platformPostId, postType, templateId, imageUrl, caption } = body

    const { data: post, error } = await supabase
      .from('published_posts')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        platform,
        platform_post_id: platformPostId,
        post_type: postType,
        template_id: templateId,
        image_url: imageUrl,
        caption
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error recording post:', error)
    return NextResponse.json({ error: 'Failed to record post' }, { status: 500 })
  }
}
