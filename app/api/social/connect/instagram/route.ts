export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Instagram uses the same Facebook OAuth - just redirect to Facebook connect
    // Instagram Business accounts are connected through Facebook Pages
    const clientId = process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com'}/api/social/callback/facebook`;
    
    if (!clientId) {
      return NextResponse.json({ 
        error: 'Instagram integration not configured. Please add FACEBOOK_APP_ID to environment variables.' 
      }, { status: 400 });
    }

    const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_comments';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${user.id}_instagram`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Instagram connect error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
