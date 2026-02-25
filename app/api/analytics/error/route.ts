export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const data = await req.json();
    const { error } = await supabase.from('error_logs').insert({
      error_message: data.error_message || data.message || null,
      error_stack: data.error_stack || data.stack || null,
      error_source: data.error_source || data.source || null,
      error_line: data.error_line || data.lineno || null,
      error_column: data.error_column || data.colno || null,
      page_url: data.page_url || data.url || null,
      user_agent: data.user_agent || null,
      user_id: data.user_id || null,
      metadata: data.metadata || {},
    });

    if (error) {
      console.error('[Error Log] Insert error:', error.message);
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error('[Error Log] Unexpected failure');
    return NextResponse.json({ success: false });
  }
}
