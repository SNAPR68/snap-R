import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = request.headers.get('x-admin-key');
  const allowAdmin = Boolean(
    adminKey &&
      (adminKey === process.env.WORKER_ADMIN_KEY || adminKey === process.env.PREPARE_ADMIN_KEY)
  );

  if (!allowAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const listingId = params.id;
  if (!listingId) {
    return NextResponse.json({ success: false, error: 'Listing id is required' }, { status: 400 });
  }

  const admin = adminSupabase();
  const { data, error } = await admin
    .from('listings')
    .select('id, title, status, prepared_at, updated_at, preparation_metadata')
    .eq('id', listingId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Listing not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, listing: data });
}
