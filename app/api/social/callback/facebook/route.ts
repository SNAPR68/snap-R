export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

import { logger } from '@/lib/logger';
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const error = req.nextUrl.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=missing_params`);
    }

    const [stateUserId, platform] = state.includes('_') ? state.split('_') : [state, 'facebook'];

    // Verify current session matches the user ID from state
    const supabaseAuth = await createServerClient();
    const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser();
    if (!sessionUser || sessionUser.id !== stateUserId) {
      logger.warn('[Facebook OAuth] Session mismatch — state userId:', stateUserId, 'session:', sessionUser?.id);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=session_mismatch`);
    }
    const userId = sessionUser.id;

    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/facebook`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`,
      { signal: AbortSignal.timeout(15000) }
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('Token error:', tokenData.error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=token_error`);
    }

    const accessToken = tokenData.access_token;

    // Exchange for long-lived token
    let longLivedToken = accessToken;
    try {
      const llResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${accessToken}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const llData = await llResponse.json();
      if (llData.access_token) {
        longLivedToken = llData.access_token;
      }
    } catch {
      logger.warn('[Facebook OAuth] Long-lived token exchange failed, using short-lived token');
    }

    // Get user info
    const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${longLivedToken}`, { signal: AbortSignal.timeout(15000) });
    const userData = await userResponse.json();

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${longLivedToken}`, { signal: AbortSignal.timeout(15000) });
    const pagesData = await pagesResponse.json();

    // Build pages array for the JSONB column
    const pagesArray = (pagesData.data || []).map((page: Record<string, string>) => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
    }));

    const firstPage = pagesArray[0] as { id: string; name: string; access_token: string } | undefined;

    // Save Facebook connection using correct schema columns
    await getSupabase().from('social_connections').upsert({
      user_id: userId,
      platform: 'facebook',
      platform_user_id: userData.id,
      platform_username: userData.name,
      access_token: longLivedToken,
      pages: pagesArray,
      default_page_id: firstPage?.id ?? null,
      profile_data: { name: userData.name, id: userData.id },
      connected_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'user_id,platform' });

    // If Instagram was requested, also get Instagram account
    if (platform === 'instagram' && firstPage?.id) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${firstPage.id}?fields=instagram_business_account&access_token=${firstPage.access_token}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name&access_token=${firstPage.access_token}`,
          { signal: AbortSignal.timeout(15000) }
        );
        const igAccount = await igAccountResponse.json();

        await getSupabase().from('social_connections').upsert({
          user_id: userId,
          platform: 'instagram',
          platform_user_id: igAccount.id,
          platform_username: igAccount.username || igAccount.name,
          access_token: firstPage.access_token, // Use page token for IG
          instagram_account: {
            id: igAccount.id,
            username: igAccount.username,
            name: igAccount.name,
            page_id: firstPage.id,
          },
          profile_data: { name: igAccount.name || igAccount.username, username: igAccount.username },
          connected_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'user_id,platform' });
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?success=facebook`);
  } catch (error: unknown) {
    logger.error('Facebook callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=server_error`);
  }
}
