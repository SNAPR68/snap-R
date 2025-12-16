import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: connections } = await supabase
      .from('social_connections')
      .select('id, platform, platform_username, platform_name, page_name, connected_at, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({ connections: connections || [] });
  } catch (error) {
    console.error('Fetch connections error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
