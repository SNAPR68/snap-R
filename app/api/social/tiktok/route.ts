import { NextResponse } from 'next/server'

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/social/tiktok/callback'

// GET - Start TikTok OAuth flow
export async function GET() {
  if (!TIKTOK_CLIENT_KEY) {
    return NextResponse.json({ error: 'TikTok Client Key not configured' }, { status: 500 })
  }

  const scopes = [
    'user.info.basic',
    'video.publish',
    'video.upload'
  ].join(',')

  const csrfState = Math.random().toString(36).substring(7)
  
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${csrfState}`

  return NextResponse.redirect(authUrl)
}
