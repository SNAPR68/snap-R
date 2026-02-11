import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const allowAdmin = Boolean(
    adminKey &&
      (adminKey === process.env.WORKER_ADMIN_KEY || adminKey === process.env.PREPARE_ADMIN_KEY)
  );

  if (!allowAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = adminSupabase();
  const { data, error } = await admin
    .from('listings')
    .select('id, title, preparation_status, updated_at, created_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message || 'No listings found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, listings: data });
}
