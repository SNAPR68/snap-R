import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connections: [] });
    }

    const { data: connections } = await supabase
      .from('social_connections')
      .select('platform, platform_username, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    return NextResponse.json({ connections: connections || [] });
  } catch (error) {
    return NextResponse.json({ connections: [] });
  }
}
