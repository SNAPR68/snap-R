import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSocialPlatformCapabilities } from '@/lib/social/capabilities';

import { logger } from '@/lib/logger';
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connections: [], capabilities: getSocialPlatformCapabilities() });
    }

    const { data: connections } = await supabase
      .from('social_connections')
      .select('id, platform, platform_username, is_active, connected_at, pages, instagram_account, default_page_id, platform_user_id, linkedin_urn, token_expires_at, last_error')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(20);

    return NextResponse.json({
      connections: connections || [],
      capabilities: getSocialPlatformCapabilities(),
    });
  } catch (error: unknown) {
    logger.error('Error fetching connections:', error);
    return NextResponse.json({ connections: [], capabilities: getSocialPlatformCapabilities() });
  }
}
