import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { getSocialCapability } from '@/lib/social/capabilities';

import { logger } from '@/lib/logger';
export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  const defaultRedirect = `${baseUrl}/dashboard/settings/social`;
  const capability = ['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter'].includes(platform)
    ? getSocialCapability(platform as 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'twitter')
    : null;

  // Extract returnTo from state (JSON) for post-OAuth redirect
  let redirectUrl = defaultRedirect;
  if (state) {
    try {
      const parsed = JSON.parse(state);
      if (parsed.returnTo && typeof parsed.returnTo === 'string'
        && parsed.returnTo.startsWith('/') && !parsed.returnTo.startsWith('//')) {
        redirectUrl = `${baseUrl}${parsed.returnTo}`;
      }
    } catch {
      // State is not JSON (plain user ID), use default redirect
    }
  }

  if (error) {
    logger.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${redirectUrl}?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${redirectUrl}?error=No authorization code received`);
  }

  if (!capability?.enabled) {
    return NextResponse.redirect(`${redirectUrl}?error=${encodeURIComponent(`${platform} is not configured for launch`)}`);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${redirectUrl}?error=Not authenticated`);
    }

    // CSRF state validation: state should match the user's ID
    // This prevents attackers from linking their social account to a victim's SnapR profile
    if (!state) {
      return NextResponse.redirect(`${redirectUrl}?error=Missing OAuth state parameter`);
    }

    // State may be base64-encoded JSON (Twitter PKCE), plain JSON, or plain user ID
    let stateUserId: string;
    let codeVerifier: string | undefined;
    try {
      // Try base64 decode first (Twitter PKCE sends btoa(JSON.stringify({csrf, code_verifier})))
      const decoded = Buffer.from(state, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      stateUserId = parsed.csrf || state;
      codeVerifier = parsed.code_verifier;
    } catch {
      try {
        // Try plain JSON (other platforms may use JSON state)
        const parsed = JSON.parse(state);
        stateUserId = parsed.csrf || state;
      } catch {
        // Plain string (user ID)
        stateUserId = state;
      }
    }

    if (stateUserId !== user.id) {
      logger.error('OAuth CSRF mismatch:', { stateUserId, userId: user.id });
      return NextResponse.redirect(`${redirectUrl}?error=OAuth state mismatch. Please try connecting again.`);
    }

    if (platform === 'facebook' || platform === 'instagram') {
      return handleFacebookOAuth(code, user.id, platform, baseUrl, redirectUrl);
    } else if (platform === 'linkedin') {
      return handleLinkedInOAuth(code, user.id, baseUrl, redirectUrl);
    } else if (platform === 'tiktok') {
      return handleTikTokOAuth(code, user.id, baseUrl, redirectUrl);
    } else if (platform === 'twitter') {
      return handleTwitterOAuth(code, user.id, baseUrl, redirectUrl, codeVerifier);
    }

    return NextResponse.redirect(`${redirectUrl}?error=Unsupported platform`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    logger.error('OAuth callback error:', err);
    return NextResponse.redirect(`${redirectUrl}?error=${encodeURIComponent(message)}`);
  }
}

async function handleFacebookOAuth(
  code: string,
  userId: string,
  platform: string,
  baseUrl: string,
  redirectUrl: string
) {
  const serviceSupabase = adminSupabase();
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const callbackUrl = `${baseUrl}/api/social/oauth/${platform}`;

  // Exchange code for access token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `code=${code}`,
    { signal: AbortSignal.timeout(15000) }
  );

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(tokenData.error.message || 'Failed to get access token');
  }

  const accessToken = tokenData.access_token;

  // Get long-lived token
  const longLivedResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `fb_exchange_token=${accessToken}`,
    { signal: AbortSignal.timeout(15000) }
  );

  const longLivedData = await longLivedResponse.json();
  const longLivedToken = longLivedData.access_token || accessToken;

  // Get user info
  const userResponse = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${longLivedToken}`,
    { signal: AbortSignal.timeout(15000) }
  );
  const userData = await userResponse.json();

  // Get user's pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longLivedToken}`,
    { signal: AbortSignal.timeout(15000) }
  );
  const pagesData = await pagesResponse.json();
  const pages = pagesData.data || [];

  // For Instagram, we need to find the connected Instagram account
  let instagramAccount = null;
  if (platform === 'instagram') {
    for (const page of pages) {
      if (page.instagram_business_account) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.instagram_business_account.id}?fields=id,username&access_token=${page.access_token}`,
          { signal: AbortSignal.timeout(15000) }
        );
        const igData = await igResponse.json();
        instagramAccount = {
          id: igData.id,
          username: igData.username,
          page_id: page.id,
          page_access_token: page.access_token,
        };
        break;
      }
    }

    if (!instagramAccount) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('No Instagram Business account found. Please connect your Instagram to a Facebook Page first.')}`
      );
    }
  }

  // Calculate token expiry (long-lived FB tokens last ~60 days)
  const expiresInSeconds = longLivedData.expires_in || 5184000; // default 60 days
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  // Upsert connection
  const connectionData: Record<string, unknown> = {
    user_id: userId,
    platform,
    platform_user_id: platform === 'instagram' ? instagramAccount?.id : userData.id,
    platform_username: platform === 'instagram' ? instagramAccount?.username : userData.name,
    access_token: platform === 'instagram' ? instagramAccount?.page_access_token : longLivedToken,
    token_expires_at: expiresAt,
    pages: pages.map((p: { id: string; name: string; access_token: string }) => ({ id: p.id, name: p.name, access_token: p.access_token })),
    instagram_account: instagramAccount ? {
      id: instagramAccount.id,
      username: instagramAccount.username,
      page_id: instagramAccount.page_id,
      page_access_token: instagramAccount.page_access_token,
    } : null,
    is_active: true,
    connected_at: new Date().toISOString(),
  };

  if (platform === 'facebook' && pages.length > 0) {
    connectionData.default_page_id = pages[0].id;
  }

  if (platform === 'instagram' && instagramAccount) {
    connectionData.default_page_id = instagramAccount.page_id;
  }

  // Check for existing connection
  const { data: existing } = await serviceSupabase
    .from('social_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();

  if (existing) {
    await serviceSupabase
      .from('social_connections')
      .update(connectionData)
      .eq('id', existing.id);
  } else {
    await serviceSupabase
      .from('social_connections')
      .insert(connectionData);
  }

  const separator = redirectUrl.includes('?') ? '&' : '?';
  return NextResponse.redirect(`${redirectUrl}${separator}connected=${platform}`);
}

async function handleLinkedInOAuth(
  code: string,
  userId: string,
  baseUrl: string,
  redirectUrl: string
) {
  const serviceSupabase = adminSupabase();
  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const callbackUrl = `${baseUrl}/api/social/oauth/linkedin`;

  // Exchange code for access token
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(tokenData.error_description || 'Failed to get LinkedIn access token');
  }

  const accessToken = tokenData.access_token;

  // Get user profile using modern OpenID Connect userinfo endpoint
  const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
  });
  const profileData = await profileResponse.json();

  // Calculate token expiry (LinkedIn tokens last ~60 days typically)
  const linkedInExpiresIn = tokenData.expires_in || 5184000; // default 60 days
  const linkedInExpiresAt = new Date(Date.now() + linkedInExpiresIn * 1000).toISOString();

  // Upsert connection — userinfo returns { sub, name, given_name, family_name, email, picture }
  const connectionData: Record<string, unknown> = {
    user_id: userId,
    platform: 'linkedin',
    platform_user_id: profileData.sub,
    platform_username: profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim(),
    access_token: accessToken,
    refresh_token: tokenData.refresh_token || null,
    token_expires_at: linkedInExpiresAt,
    linkedin_urn: `urn:li:person:${profileData.sub}`,
    is_active: true,
    connected_at: new Date().toISOString(),
  };

  const { data: existing } = await serviceSupabase
    .from('social_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'linkedin')
    .single();

  if (existing) {
    await serviceSupabase
      .from('social_connections')
      .update(connectionData)
      .eq('id', existing.id);
  } else {
    await serviceSupabase
      .from('social_connections')
      .insert(connectionData);
  }

  const separator = redirectUrl.includes('?') ? '&' : '?';
  return NextResponse.redirect(`${redirectUrl}${separator}connected=linkedin`);
}

async function handleTikTokOAuth(
  code: string,
  userId: string,
  baseUrl: string,
  redirectUrl: string
) {
  const serviceSupabase = adminSupabase();
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const callbackUrl = `${baseUrl}/api/social/oauth/tiktok`;

  // Exchange code for access token (TikTok v2 uses JSON body)
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to get TikTok access token');
  }

  const accessToken = tokenData.access_token;
  const openId = tokenData.open_id;

  // Get user profile
  const profileResponse = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    }
  );
  const profileData = await profileResponse.json();
  const userInfo = profileData.data?.user || {};

  // Calculate token expiry (TikTok tokens last ~24 hours, refresh tokens ~365 days)
  const tiktokExpiresIn = tokenData.expires_in || 86400; // default 24 hours
  const tiktokExpiresAt = new Date(Date.now() + tiktokExpiresIn * 1000).toISOString();

  // Upsert connection
  const connectionData: Record<string, unknown> = {
    user_id: userId,
    platform: 'tiktok',
    platform_user_id: openId,
    platform_username: userInfo.display_name || openId,
    access_token: accessToken,
    refresh_token: tokenData.refresh_token || null,
    token_expires_at: tiktokExpiresAt,
    is_active: true,
    connected_at: new Date().toISOString(),
  };

  const { data: existing } = await serviceSupabase
    .from('social_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'tiktok')
    .single();

  if (existing) {
    await serviceSupabase
      .from('social_connections')
      .update(connectionData)
      .eq('id', existing.id);
  } else {
    await serviceSupabase
      .from('social_connections')
      .insert(connectionData);
  }

  const separator = redirectUrl.includes('?') ? '&' : '?';
  return NextResponse.redirect(`${redirectUrl}${separator}connected=tiktok`);
}

async function handleTwitterOAuth(
  code: string,
  userId: string,
  baseUrl: string,
  redirectUrl: string,
  codeVerifier?: string
) {
  const serviceSupabase = adminSupabase();
  const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const callbackUrl = `${baseUrl}/api/social/oauth/twitter`;

  if (!codeVerifier) {
    throw new Error('Missing PKCE code_verifier for Twitter OAuth');
  }

  // Exchange code for access token (Twitter OAuth 2.0 with PKCE)
  // Twitter requires Basic auth header with client_id:client_secret
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to get Twitter access token');
  }

  const accessToken = tokenData.access_token;

  // Get user profile
  const profileResponse = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url',
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    }
  );

  const profileData = await profileResponse.json();
  const twitterUser = profileData.data;

  if (!twitterUser) {
    throw new Error('Failed to fetch Twitter user profile');
  }

  // Calculate token expiry (Twitter OAuth 2.0 tokens last ~2 hours)
  const twitterExpiresIn = tokenData.expires_in || 7200;
  const twitterExpiresAt = new Date(Date.now() + twitterExpiresIn * 1000).toISOString();

  // Upsert connection
  const connectionData: Record<string, unknown> = {
    user_id: userId,
    platform: 'twitter',
    platform_user_id: twitterUser.id,
    platform_username: twitterUser.username,
    access_token: accessToken,
    refresh_token: tokenData.refresh_token || null,
    token_expires_at: twitterExpiresAt,
    is_active: true,
    connected_at: new Date().toISOString(),
  };

  const { data: existing } = await serviceSupabase
    .from('social_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'twitter')
    .single();

  if (existing) {
    await serviceSupabase
      .from('social_connections')
      .update(connectionData)
      .eq('id', existing.id);
  } else {
    await serviceSupabase
      .from('social_connections')
      .insert(connectionData);
  }

  const separator = redirectUrl.includes('?') ? '&' : '?';
  return NextResponse.redirect(`${redirectUrl}${separator}connected=twitter`);
}
