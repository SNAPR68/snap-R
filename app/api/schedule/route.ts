import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch scheduled posts
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'scheduled'
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const { data: posts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST - Create scheduled post
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { 
      listingId, 
      platform, 
      postType, 
      templateId, 
      imageUrl, 
      caption, 
      hashtags, 
      scheduledAt,
      propertyData,
      brandData
    } = body

    if (!platform || !scheduledAt) {
      return NextResponse.json({ error: 'Platform and scheduledAt required' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        platform,
        post_type: postType || 'just-listed',
        template_id: templateId || 'default',
        image_url: imageUrl,
        caption,
        hashtags,
        scheduled_at: scheduledAt,
        property_data: propertyData,
        brand_data: brandData
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error creating scheduled post:', error)
    return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 })
  }
}

// DELETE - Cancel scheduled post
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    const { error } = await supabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling post:', error)
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
  }
}
