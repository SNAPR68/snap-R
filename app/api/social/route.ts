import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch connected social accounts
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: connections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)

    return NextResponse.json({ connections: connections || [] })
  } catch (error) {
    console.error('Error fetching social connections:', error)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

// DELETE - Disconnect a social account
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platform } = await request.json()

    await supabase
      .from('social_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
