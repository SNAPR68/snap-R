export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/social/linkedin/callback'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=linkedin_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=no_code', request.url))
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI!,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!
      })
    })
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('LinkedIn token error:', tokenData)
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=token_failed', request.url))
    }

    // Get user profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })
    const profile = await profileRes.json()

    // Save to database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('social_connections')
        .upsert({
          user_id: user.id,
          platform: 'linkedin',
          platform_id: profile.sub,
          name: profile.name || profile.email,
          access_token: tokenData.access_token,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_id' })
    }

    return NextResponse.redirect(new URL('/dashboard/content-studio?connected=linkedin', request.url))
  } catch (error) {
    console.error('LinkedIn callback error:', error)
    return NextResponse.redirect(new URL('/dashboard/content-studio?error=callback_failed', request.url))
  }
}
