import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';

export async function POST() {
  // Block in production — this test route actually posts to LinkedIn
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = adminSupabase();

    const { data: connection, error: connError } = await serviceSupabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: 'LinkedIn not connected', connError });
    }

    const accessToken = connection.access_token;
    const personId = connection.platform_user_id;

    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(15000),
    });
    const profileData = await profileRes.json();

    const testContent = `Test post from SnapR - ${new Date().toISOString()}`;

    const ugcBody = {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: testContent },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const ugcRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(ugcBody),
          signal: AbortSignal.timeout(15000),
    });

    const ugcText = await ugcRes.text();

    const postsBody = {
      author: `urn:li:person:${personId}`,
      commentary: testContent + ' (Posts API)',
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
    };

    const postsRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify(postsBody),
          signal: AbortSignal.timeout(15000),
    });

    const postsText = await postsRes.text();
    const postsUrn = postsRes.headers.get('x-restli-id');

    return NextResponse.json({
      connection: {
        platform_user_id: personId,
        platform_name: connection.platform_username,
        has_token: !!accessToken,
        token_expires: connection.token_expires_at,
      },
      profile: {
        status: profileRes.status,
        data: profileData,
      },
      ugcPosts: {
        status: ugcRes.status,
        response: ugcText,
      },
      postsApi: {
        status: postsRes.status,
        response: postsText,
        urn: postsUrn,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
