export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

import { logger } from '@/lib/logger';
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com';

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const error = req.nextUrl.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=missing_params`);
    }

    const stateUserId = state;

    // Verify current session matches the user ID from state
    const supabaseAuth = await createServerClient();
    const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser();
    if (!sessionUser || sessionUser.id !== stateUserId) {
      logger.warn('[LinkedIn OAuth] Session mismatch — state userId:', stateUserId, 'session:', sessionUser?.id);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=session_mismatch`);
    }
    const userId = sessionUser.id;
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/social/callback/linkedin`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
          signal: AbortSignal.timeout(15000),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('LinkedIn token error:', tokenData);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=token_error`);
    }

    const accessToken = tokenData.access_token;

    // Get user profile using OpenID Connect userinfo endpoint
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(15000),
    });

    const profileData = await profileResponse.json();
    logger.info('LinkedIn profile:', profileData);

    // Save LinkedIn connection using correct schema columns
    const { error: dbError } = await supabase.from('social_connections').upsert({
      user_id: userId,
      platform: 'linkedin',
      platform_user_id: profileData.sub,
      platform_username: profileData.email || profileData.name,
      access_token: accessToken,
      linkedin_urn: `urn:li:person:${profileData.sub}`,
      profile_data: { name: profileData.name, email: profileData.email, picture: profileData.picture },
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      connected_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'user_id,platform' });

    if (dbError) {
      logger.error('DB error:', dbError);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=db_error`);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?success=linkedin`);
  } catch (error: unknown) {
    logger.error('LinkedIn callback error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=server_error`);
  }
}
