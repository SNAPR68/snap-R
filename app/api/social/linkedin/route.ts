import { NextResponse } from 'next/server'

const NEXT_PUBLIC_LINKEDIN_CLIENT_ID = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/social/linkedin/callback'

// GET - Start LinkedIn OAuth flow
export async function GET() {
  if (!NEXT_PUBLIC_LINKEDIN_CLIENT_ID) {
    return NextResponse.json({ error: 'LinkedIn Client ID not configured' }, { status: 500 })
  }

  const scopes = [
    'openid',
    'profile',
    'email',
    'w_member_social'
  ].join(' ')

  const state = Math.random().toString(36).substring(7)
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${state}`

  return NextResponse.redirect(authUrl)
}
