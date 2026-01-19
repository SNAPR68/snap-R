import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const data = await req.json();
    await supabase.from('error_logs').insert(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json({ success: false });
  }
}
