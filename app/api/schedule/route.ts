import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { schedulePostSchema } from '@/lib/validation/schemas'

// GET - Fetch scheduled posts
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100') || 100, 200)

    let query = supabase
      .from('scheduled_posts')
      .select('*, listings(title, address)')
      .eq('user_id', user.id)

    // Support comma-separated statuses (e.g. "pending,published,failed")
    const statuses = status.split(',').map(s => s.trim())
    if (statuses.length === 1) {
      query = query.eq('status', statuses[0])
    } else {
      query = query.in('status', statuses)
    }

    const { data: posts, error } = await query
      .order('scheduled_for', { ascending: true })
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

    const rawBody = await request.json()
    const parsed = schedulePostSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }
    const { listingId, platform, postType, content, imageUrls, scheduledFor } = parsed.data

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        platform,
        post_type: postType || 'just_listed',
        content: content || '',
        image_urls: imageUrls || [],
        scheduled_for: scheduledFor,
        status: 'pending',
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

// PATCH - Reschedule a pending post (drag-and-drop)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, scheduledFor } = await request.json()
    if (!id || !scheduledFor) {
      return NextResponse.json({ error: 'id and scheduledFor are required' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .update({ scheduled_for: scheduledFor, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) throw error
    if (!post) return NextResponse.json({ error: 'Post not found or already published' }, { status: 404 })

    return NextResponse.json({ post })
  } catch (error: unknown) {
    console.error('Error rescheduling post:', error)
    return NextResponse.json({ error: 'Failed to reschedule post' }, { status: 500 })
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
