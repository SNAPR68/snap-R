import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { propertySiteSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
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
  } catch (error: unknown) {
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
    const validated = parseBody(propertySiteSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }
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
  } catch (error: unknown) {
    logger.error('Error creating site:', error)
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 })
  }
}

// PATCH - Update property site (publish/unpublish, theme, etc.)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = parseBody(propertySiteSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }
    const { id, is_published, template, custom_colors, agent_info } = body

    if (!id) return NextResponse.json({ error: 'Site ID required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (typeof is_published === 'boolean') updates.is_published = is_published
    if (template) updates.template = template
    if (custom_colors !== undefined) updates.custom_colors = custom_colors
    if (agent_info !== undefined) updates.agent_info = agent_info

    const { data: site, error } = await supabase
      .from('property_sites')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ site })
  } catch (error: unknown) {
    logger.error('Error updating site:', error)
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 })
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
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
