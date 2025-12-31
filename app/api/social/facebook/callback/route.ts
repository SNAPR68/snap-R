import { NextResponse } from 'next/server'
export const dynamic = "force-dynamic"
import { createClient } from '@/lib/supabase/server'

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/social/facebook/callback'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=oauth_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=no_code', request.url))
    }

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${FB_APP_SECRET}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(new URL('/dashboard/content-studio?error=token_failed', request.url))
    }

    // Get long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    )
    const longTokenData = await longTokenRes.json()
    const accessToken = longTokenData.access_token || tokenData.access_token

    // Get user's Facebook pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()

    // Get Instagram business accounts linked to pages
    const pages = pagesData.data || []
    const connections = []

    for (const page of pages) {
      connections.push({
        platform: 'facebook',
        platform_id: page.id,
        name: page.name,
        access_token: page.access_token
      })

      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      )
      const igData = await igRes.json()

      if (igData.instagram_business_account) {
        const igAccountRes = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=username,name&access_token=${page.access_token}`
        )
        const igAccount = await igAccountRes.json()

        connections.push({
          platform: 'instagram',
          platform_id: igData.instagram_business_account.id,
          name: igAccount.username || igAccount.name,
          access_token: page.access_token,
          page_id: page.id
        })
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && connections.length > 0) {
      for (const conn of connections) {
        await supabase
          .from('social_connections')
          .upsert({
            user_id: user.id,
            platform: conn.platform,
            platform_id: conn.platform_id,
            name: conn.name,
            access_token: conn.access_token,
            page_id: conn.page_id || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,platform,platform_id' })
      }
    }

    return NextResponse.redirect(new URL('/dashboard/content-studio?connected=true', request.url))
  } catch (error) {
    console.error('Facebook callback error:', error)
    return NextResponse.redirect(new URL('/dashboard/content-studio?error=callback_failed', request.url))
  }
}
