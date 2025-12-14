import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch user's property sites
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sites } = await supabase
      .from('property_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ sites: sites || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
  }
}

// POST - Create property site
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { listingId, slug, template, customColors, agentInfo } = body

    // Generate unique slug if not provided
    const finalSlug = slug || `property-${Date.now().toString(36)}`

    const { data: site, error } = await supabase
      .from('property_sites')
      .insert({
        user_id: user.id,
        listing_id: listingId,
        slug: finalSlug,
        template: template || 'modern',
        custom_colors: customColors || null,
        agent_info: agentInfo || null,
        is_published: true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ site, url: `/p/${finalSlug}` })
  } catch (error) {
    console.error('Error creating site:', error)
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 })
  }
}

// DELETE - Delete property site
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    await supabase.from('property_sites').delete().eq('id', id).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
