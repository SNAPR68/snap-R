export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const [userId, platform] = state.includes('_') ? state.split('_') : [state, 'facebook'];
    
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/facebook`;

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token error:', tokenData.error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=token_error`);
    }

    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`);
    const userData = await userResponse.json();

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    const page = pagesData.data?.[0]; // Use first page

    // Save Facebook connection
    await supabase.from('social_connections').upsert({
      user_id: userId,
      platform: 'facebook',
      platform_user_id: userData.id,
      platform_name: userData.name,
      access_token: accessToken,
      page_id: page?.id,
      page_name: page?.name,
      page_access_token: page?.access_token,
      connected_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'user_id,platform' });

    // If Instagram was requested, also get Instagram account
    if (platform === 'instagram' && page?.id) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name&access_token=${page.access_token}`
        );
        const igAccount = await igAccountResponse.json();

        await supabase.from('social_connections').upsert({
          user_id: userId,
          platform: 'instagram',
          platform_user_id: igAccount.id,
          platform_username: igAccount.username,
          platform_name: igAccount.name || igAccount.username,
          access_token: page.access_token, // Use page token for IG
          page_id: page.id, // Store associated page ID
          connected_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'user_id,platform' });
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?success=facebook`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/social?error=server_error`);
  }
}
