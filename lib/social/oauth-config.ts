// Social Media OAuth Configuration
// Facebook, Instagram, LinkedIn integration

export const SOCIAL_PLATFORMS = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'publish_to_groups'],
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
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
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
    params.append('code_challenge', 'challenge'); // Simplified, should use PKCE
    params.append('code_challenge_method', 'plain');
  }

  return `${config.authUrl}?${params.toString()}`;
}

// Exchange code for token
export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  redirectUri: string
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

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
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

// Get user profile from platform
export async function getUserProfile(platform: SocialPlatform, accessToken: string): Promise<any> {
  const config = SOCIAL_PLATFORMS[platform];

  let url: string;
  let headers: Record<string, string> = {};

  switch (platform) {
    case 'facebook':
      url = `${config.apiBase}/me?fields=id,name,picture`;
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    case 'instagram':
      url = `${config.apiBase}/me?fields=id,username,account_type`;
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    case 'linkedin':
      url = `${config.apiBase}/me`;
      headers['Authorization'] = `Bearer ${accessToken}`;
      break;
    default:
      throw new Error(`Profile fetch not implemented for ${platform}`);
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${await response.text()}`);
  }

  return response.json();
}

// Get Facebook Pages (for publishing)
export async function getFacebookPages(accessToken: string): Promise<any[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Facebook pages');
  }

  const data = await response.json();
  return data.data || [];
}

// Get Instagram accounts connected to Facebook Pages
export async function getInstagramAccounts(accessToken: string, pageId: string): Promise<any> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Instagram account');
  }

  return response.json();
}
