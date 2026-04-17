export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOAuthUrl } from '@/lib/social/oauth-config';
import { getSocialCapability } from '@/lib/social/capabilities';

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=unauthorized`);
    }

    const capability = getSocialCapability('facebook');
    if (!capability.enabled) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/social?error=${encodeURIComponent('Facebook is not configured for launch yet.')}`
      );
    }

    const redirectUri = `${baseUrl}/api/social/oauth/facebook`;
    const authUrl = getOAuthUrl('facebook', redirectUri, user.id);
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    logger.error('Facebook connect error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com';
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/social?error=server_error`);
  }
}
