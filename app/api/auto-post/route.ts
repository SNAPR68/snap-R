import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoPostRuleCreateSchema, autoPostRuleToggleSchema, autoPostRuleDeleteSchema, parseBody } from '@/lib/validation/schemas'

// GET - Fetch auto-post rules
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rules } = await supabase
      .from('auto_post_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ rules: rules || [] })
  } catch (error) {
    console.error('Error fetching rules:', error)
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

// POST - Create auto-post rule
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = parseBody(autoPostRuleCreateSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 })
    }
    const { name, triggerEvent, triggerValue, platforms, postType, templateId, includeCaption, includeHashtags } = parsed.data

    const { data: rule, error } = await supabase
      .from('auto_post_rules')
      .insert({
        user_id: user.id,
        name,
        trigger_event: triggerEvent,
        trigger_value: triggerValue,
        platforms,
        post_type: postType,
        template_id: templateId,
        include_caption: includeCaption ?? true,
        include_hashtags: includeHashtags ?? true
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error creating rule:', error)
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}

// PATCH - Toggle rule active status
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = parseBody(autoPostRuleToggleSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 })
    }
    const { id, isActive } = parsed.data

    const { error } = await supabase
      .from('auto_post_rules')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating rule:', error)
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }
}

// DELETE - Delete rule
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = parseBody(autoPostRuleDeleteSchema, body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 })
    }
    const { id } = parsed.data

    await supabase.from('auto_post_rules').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
