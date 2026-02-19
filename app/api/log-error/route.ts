export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

// Simple in-memory rate limiter for error logging (max 30 per minute per IP)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = rateLimiter.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= 30) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    }

    // Clean up old entries periodically
    if (rateLimiter.size > 1000) {
      for (const [key, val] of rateLimiter) {
        if (now > val.resetAt) rateLimiter.delete(key);
      }
    }

    const body = await request.json();
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
  } catch (e) {
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
