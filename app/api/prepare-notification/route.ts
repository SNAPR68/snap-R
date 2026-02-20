import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyListingPrepared } from '@/lib/notifications/sender';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, type, channels, data } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, notification_preferences')
      .eq('id', user.id)
      .single();

    if (!profile) {
      console.log('[PrepareNotification] No profile found for user:', user.id);
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get listing title
    const { data: listing } = await supabase
      .from('listings')
      .select('title, address')
      .eq('id', listingId)
      .single();

    const listingTitle = listing?.title || listing?.address || 'Your listing';

    // Build preferences with phone number
    const preferences = {
      ...(profile.notification_preferences || {}),
      whatsappNumber: profile.phone || undefined,
    };

    // Send notification (email + whatsapp based on user preferences)
    const results = await notifyListingPrepared(
      user.id,
      profile.email || user.email || '',
      profile.full_name || 'there',
      listingId,
      listingTitle,
      data?.confidence || 0,
      data?.photosProcessed || 0,
      preferences
    );

    console.log(`[PrepareNotification] Sent for listing ${listingId}:`,
      results.map((r: any) => `${r.channel}: ${r.success}`));

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[PrepareNotification] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
