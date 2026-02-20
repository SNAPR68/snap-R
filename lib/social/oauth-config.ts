// Social Media OAuth Configuration
// Facebook, Instagram, LinkedIn integration

import { randomBytes, createHash } from 'crypto';

export const SOCIAL_PLATFORMS = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_video', 'pages_show_list', 'publish_to_groups'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiBase: 'https://graph.facebook.com/v18.0',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E4405F',
    // Instagram uses Facebook's Graph API
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiBase: 'https://graph.facebook.com/v18.0',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: '#0A66C2',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    apiBase: 'https://api.linkedin.com/v2',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'Music2',
    color: '#000000',
    scopes: ['user.info.basic', 'video.publish'],
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    apiBase: 'https://open-api.tiktok.com',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'Twitter',
    color: '#000000',
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    apiBase: 'https://api.twitter.com/2',
  },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

// Environment variables
export const SOCIAL_CREDENTIALS = {
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
  },
  instagram: {
    clientId: process.env.FACEBOOK_APP_ID || '', // Same as Facebook
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
  },
} as const;

// PKCE helpers for Twitter OAuth 2.0
function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

// Generate OAuth URL
export function getOAuthUrl(platform: SocialPlatform, redirectUri: string, state: string): string {
  const config = SOCIAL_PLATFORMS[platform];
  const credentials = SOCIAL_CREDENTIALS[platform];

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    state: state,
    response_type: 'code',
  });

  // Platform-specific scope handling
  if (platform === 'facebook' || platform === 'instagram') {
    params.append('scope', config.scopes.join(','));
  } else if (platform === 'linkedin') {
    params.append('scope', config.scopes.join(' '));
  } else if (platform === 'tiktok') {
    params.append('scope', config.scopes.join(','));
    params.append('response_type', 'code');
  } else if (platform === 'twitter') {
    params.append('scope', config.scopes.join(' '));
    // Proper PKCE with S256 method
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    params.append('code_challenge', challenge);
    params.append('code_challenge_method', 'S256');
    // Embed verifier in state so callback can use it for token exchange
    params.set('state', JSON.stringify({ csrf: state, code_verifier: verifier }));
  }

  return `${config.authUrl}?${params.toString()}`;
}

// Exchange code for token
export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}> {
  const config = SOCIAL_PLATFORMS[platform];
  const credentials = SOCIAL_CREDENTIALS[platform];

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code: code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  // Include PKCE verifier for Twitter
  if (platform === 'twitter' && codeVerifier) {
    params.append('code_verifier', codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

// Refresh an expired access token
export async function refreshAccessToken(
  platform: SocialPlatform,
  tokenOrRefreshToken: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const config = SOCIAL_PLATFORMS[platform];
  const credentials = SOCIAL_CREDENTIALS[platform];

  if (platform === 'facebook' || platform === 'instagram') {
    // Facebook/Instagram: exchange current access_token for a new long-lived token.
    // Note: Facebook does NOT use refresh_token — you pass the current access_token
    // with the fb_exchange_token grant type to get a new long-lived token.
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      fb_exchange_token: tokenOrRefreshToken,
    });
    const res = await fetch(`${config.tokenUrl}?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`FB token refresh failed: ${await res.text()}`);
    const data = await res.json();
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }

  // LinkedIn and others: standard refresh_token grant
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokenOrRefreshToken,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// Get user profile from platform
export async function getUserProfile(platform: SocialPlatform, accessToken: string): Promise<Record<string, unknown>> {
  let url: string;
  const headers: Record<string, string> = {};

  switch (platform) {
    case 'facebook':
      url = `https://graph.facebook.com/v18.0/me?fields=id,name,picture`;
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    case 'instagram':
      url = `https://graph.facebook.com/v18.0/me?fields=id,username,account_type`;
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    case 'linkedin':
      // Use modern OpenID Connect userinfo endpoint
      url = 'https://api.linkedin.com/v2/userinfo';
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    case 'tiktok':
      // TikTok User Info endpoint
      url = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name';
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    case 'twitter':
      // Twitter/X v2 user lookup
      url = 'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url';
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
  }

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${await response.text()}`);
  }

  return response.json();
}

// Get Facebook Pages (for publishing)
export async function getFacebookPages(accessToken: string): Promise<Record<string, unknown>[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Facebook pages');
  }

  const data = await response.json();
  return data.data || [];
}

// Get Instagram accounts connected to Facebook Pages
export async function getInstagramAccounts(accessToken: string, pageId: string): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Instagram account');
  }

  return response.json();
}
