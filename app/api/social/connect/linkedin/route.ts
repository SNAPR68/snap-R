import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com'}/api/social/callback/linkedin`;
    
    if (!clientId) {
      return NextResponse.json({ 
        error: 'LinkedIn integration not configured. Please add LINKEDIN_CLIENT_ID to environment variables.' 
      }, { status: 400 });
    }

    const scope = 'openid profile email w_member_social';
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${user.id}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('LinkedIn connect error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
