export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { logErrorSchema, parseBody } from '@/lib/validation/schemas'
import { getClientIp } from '@/lib/utils/client-ip';
import { checkRateLimitAsync } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 req/min per IP (uses Upstash Redis in production)
    const ip = getClientIp(request.headers);
    const { success: withinLimit } = await checkRateLimitAsync(`log-error:${ip}`, 30, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await request.json();
    const validated = parseBody(logErrorSchema, body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 });
    }
    const supabase = adminSupabase();

    // Sanitize and limit input
    const message = typeof body.message === 'string' ? body.message.slice(0, 2000) : 'Unknown client error';
    const stack = typeof body.stack === 'string' ? body.stack.slice(0, 5000) : undefined;
    const url = typeof body.url === 'string' ? body.url.slice(0, 500) : undefined;

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'client',
      message,
      metadata: {
        stack,
        url,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
