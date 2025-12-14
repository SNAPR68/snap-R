import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch saved content
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const favorites = searchParams.get('favorites') === 'true'

    let query = supabase.from('content_library').select('*').eq('user_id', user.id)
    if (category && category !== 'all') query = query.eq('category', category)
    if (favorites) query = query.eq('is_favorite', true)
    query = query.order('created_at', { ascending: false })

    const { data: content } = await query
    return NextResponse.json({ content: content || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST - Save content to library
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, category, platform, postType, templateId, imageUrl, caption, hashtags, propertyData } = body

    const { data: item, error } = await supabase
      .from('content_library')
      .insert({
        user_id: user.id,
        name: name || `Saved ${new Date().toLocaleDateString()}`,
        category: category || 'general',
        platform, post_type: postType, template_id: templateId,
        image_url: imageUrl, caption, hashtags,
        property_data: propertyData
      })
      .select().single()

    if (error) throw error
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// PATCH - Toggle favorite or update use count
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, action } = await request.json()

    if (action === 'favorite') {
      const { data: item } = await supabase.from('content_library').select('is_favorite').eq('id', id).single()
      await supabase.from('content_library').update({ is_favorite: !item?.is_favorite }).eq('id', id).eq('user_id', user.id)
    } else if (action === 'use') {
      await supabase.rpc('increment_use_count', { item_id: id })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE - Remove from library
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    await supabase.from('content_library').delete().eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
