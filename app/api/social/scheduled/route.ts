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

    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select('*, listings(title)')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: false })
      .limit(100);

    return NextResponse.json({ posts: posts || [] });
  } catch (error) {
    console.error('Fetch scheduled posts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
