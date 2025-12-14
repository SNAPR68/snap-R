export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/social/tiktok/callback'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=tiktok_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=no_code', request.url))
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY!,
        client_secret: TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI!
      })
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('TikTok token error:', tokenData)
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=token_failed', request.url))
    }

    // Get user info
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })
    const userData = await userRes.json()
    const userInfo = userData.data?.user || {}

    // Save to database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'tiktok',
          platform_id: tokenData.open_id || userInfo.open_id,
          name: userInfo.display_name || 'TikTok User',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_id' })
    }

    return NextResponse.redirect(new URL('/dashboard/content-studio?connected=tiktok', request.url))
  } catch (error) {
    console.error('TikTok callback error:', error)
    return NextResponse.redirect(new URL('/dashboard/content-studio?error=callback_failed', request.url))
  }
}
