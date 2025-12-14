import { NextResponse } from 'next/server'

const FB_APP_ID = process.env.FACEBOOK_APP_ID
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/social/facebook/callback'

// GET - Start Facebook OAuth flow
export async function GET() {
  if (!FB_APP_ID) {
    return NextResponse.json({ error: 'Facebook App ID not configured' }, { status: 500 })
  }

  const scopes = [
    'pages_show_list',
    'pages_read_engagement', 
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
    'business_management'
  ].join(',')

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&response_type=code`

  return NextResponse.redirect(authUrl)
}
