import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch user's watermark settings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: settings } = await supabase
      .from('user_settings')
      .select('watermark_enabled, watermark_text, watermark_logo_url, watermark_position, watermark_opacity')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ settings: settings || { watermark_enabled: false, watermark_position: 'bottom-right', watermark_opacity: 50 } })
  } catch (error) {
    console.error('Error fetching watermark:', error)
    return NextResponse.json({ settings: { watermark_enabled: false, watermark_position: 'bottom-right', watermark_opacity: 50 } })
  }
}

// POST - Update watermark settings
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { enabled, text, logoUrl, position, opacity } = body

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        watermark_enabled: enabled,
        watermark_text: text || null,
        watermark_logo_url: logoUrl || null,
        watermark_position: position || 'bottom-right',
        watermark_opacity: opacity || 50,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving watermark:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
