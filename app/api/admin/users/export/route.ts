import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.ADMIN_SECRET || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: users } = await adminSupabase()
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

