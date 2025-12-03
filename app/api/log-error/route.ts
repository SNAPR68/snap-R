export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'client',
      message: body.message || 'Unknown client error',
      metadata: {
        stack: body.stack,
        componentStack: body.componentStack,
        url: body.url,
        userAgent: body.userAgent,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ logged: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
