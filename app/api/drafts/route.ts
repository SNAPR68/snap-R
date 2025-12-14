import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch drafts
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: drafts } = await supabase
      .from('post_drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    return NextResponse.json({ drafts: drafts || [] })
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
  }
}

// POST - Create/Update draft
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, listingId, name, platform, postType, templateId, caption, hashtags, propertyData, brandData } = body

    if (id) {
      // Update existing draft
      const { data: draft, error } = await supabase
        .from('post_drafts')
        .update({
          name, platform, post_type: postType, template_id: templateId,
          caption, hashtags, property_data: propertyData, brand_data: brandData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ draft })
    } else {
      // Create new draft
      const { data: draft, error } = await supabase
        .from('post_drafts')
        .insert({
          user_id: user.id,
          listing_id: listingId || null,
          name: name || `Draft - ${new Date().toLocaleDateString()}`,
          platform, post_type: postType, template_id: templateId,
          caption, hashtags, property_data: propertyData, brand_data: brandData
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ draft })
    }
  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

// DELETE - Delete draft
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    await supabase.from('post_drafts').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
