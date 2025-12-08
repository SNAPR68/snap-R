import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's brand profile
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: brandProfile, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user hasn't created profile yet)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ brandProfile: brandProfile || null })
  } catch (error) {
    console.error('Brand profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch brand profile' }, { status: 500 })
  }
}

// POST - Create or update brand profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const brandData = {
      user_id: user.id,
      business_name: body.business_name || null,
      logo_url: body.logo_url || null,
      primary_color: body.primary_color || '#D4AF37',
      secondary_color: body.secondary_color || '#1A1A1A',
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      brokerage_name: body.brokerage_name || null,
      brokerage_logo_url: body.brokerage_logo_url || null,
      license_number: body.license_number || null,
      tagline: body.tagline || null,
      social_handles: body.social_handles || {},
      updated_at: new Date().toISOString()
    }

    // Upsert - create if not exists, update if exists
    const { data: brandProfile, error } = await supabase
      .from('brand_profiles')
      .upsert(brandData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Brand profile save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ brandProfile, success: true })
  } catch (error) {
    console.error('Brand profile save error:', error)
    return NextResponse.json({ error: 'Failed to save brand profile' }, { status: 500 })
  }
}
