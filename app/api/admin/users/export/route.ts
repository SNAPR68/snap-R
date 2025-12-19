import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan, credits, created_at')
      .order('created_at', { ascending: false });

    const csv = [
      'ID,Email,Name,Plan,Credits,Created At',
      ...(users || []).map(u => 
        `${u.id},${u.email},${u.full_name || ''},${u.plan || 'free'},${u.credits || 0},${u.created_at}`
      )
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=snapr-users-${new Date().toISOString().split('T')[0]}.csv`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

