export type SocialCapabilityPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'twitter';

export interface SocialPlatformCapability {
  platform: SocialCapabilityPlatform;
  name: string;
  launchVisible: boolean;
  enabled: boolean;
  missing: string[];
}

function hasEnvVar(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function enabledWith(...envNames: string[]): { enabled: boolean; missing: string[] } {
  const missing = envNames.filter((name) => !hasEnvVar(name));
  return { enabled: missing.length === 0, missing };
}

export function getSocialPlatformCapabilities(): SocialPlatformCapability[] {
  const facebook = enabledWith('NEXT_PUBLIC_FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'NEXT_PUBLIC_APP_URL');
  const linkedin = enabledWith('NEXT_PUBLIC_LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'NEXT_PUBLIC_APP_URL');
  const tiktok = enabledWith('NEXT_PUBLIC_TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'NEXT_PUBLIC_APP_URL');
  const twitter = enabledWith('NEXT_PUBLIC_TWITTER_CLIENT_ID', 'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'NEXT_PUBLIC_APP_URL');

  return [
    {
      platform: 'facebook',
      name: 'Facebook',
      launchVisible: true,
      enabled: facebook.enabled,
      missing: facebook.missing,
    },
    {
      platform: 'instagram',
      name: 'Instagram',
      launchVisible: true,
      enabled: facebook.enabled,
      missing: facebook.missing,
    },
    {
      platform: 'linkedin',
      name: 'LinkedIn',
      launchVisible: true,
      enabled: linkedin.enabled,
      missing: linkedin.missing,
    },
    {
      platform: 'tiktok',
      name: 'TikTok',
      launchVisible: false,
      enabled: tiktok.enabled,
      missing: tiktok.missing,
    },
    {
      platform: 'twitter',
      name: 'X (Twitter)',
      launchVisible: false,
      enabled: twitter.enabled,
      missing: twitter.missing,
    },
  ];
}

export function getSocialCapability(platform: SocialCapabilityPlatform): SocialPlatformCapability {
  return getSocialPlatformCapabilities().find((capability) => capability.platform === platform) ?? {
    platform,
    name: platform,
    launchVisible: false,
    enabled: false,
    missing: [],
  };
}
