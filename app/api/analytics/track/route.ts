export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyticsTrackSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json(); const validated = parseBody(analyticsTrackSchema, data); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
    const country = req.headers.get('x-vercel-ip-country') || null;
    const city = req.headers.get('x-vercel-ip-city') || null;

    const { error } = await getSupabase().from('analytics_events').insert({
      session_id: data.session_id || null,
      event_type: data.event_type || 'action',
      event_name: data.event_name || 'unknown',
      event_data: data.event_data || {},
      page_url: data.page_url || null,
      referrer: data.referrer || null,
      user_agent: data.user_agent || null,
      device_type: data.device_type || null,
      browser: data.browser || null,
      user_id: data.user_id || null,
      ip_address: ip,
      country,
      city,
    });

    if (error) {
      logger.error('[Analytics Track] Insert error:', error.message);
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
