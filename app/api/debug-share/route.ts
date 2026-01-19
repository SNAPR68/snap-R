import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '8707ec4f448c';
  
  const { data: share, error: shareError } = await getSupabase()
    .from('shares')
    .select('*')
    .eq('token', token)
    .single();
  
  let listingCheck = null;
  if (share?.listing_id) {
    const { data: listing, error: listingError } = await getSupabase()
      .from('listings')
      .select('id, title')
      .eq('id', share.listing_id)
      .single();
    listingCheck = { listing, listingError };
  }
  
  let photosCheck = null;
  if (share?.listing_id) {
    const { data: photos, error: photosError } = await getSupabase()
      .from('photos')
      .select('id, status')
      .eq('listing_id', share.listing_id)
      .eq('status', 'completed');
    photosCheck = { count: photos?.length, photosError };
  }
  
  return NextResponse.json({
    token,
    share,
    shareError,
    listingCheck,
    photosCheck
  }, { status: 200 });
}
