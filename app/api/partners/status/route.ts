import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = adminSupabase();

    // Get partner application by user's email
    const { data: application } = await admin
      .from('partner_applications')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (!application) {
      return NextResponse.json({ found: false });
    }

    // Count referral signups if approved
    let referralCount = 0;
    if (application.referral_code && application.status === 'approved') {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', application.referral_code);
      referralCount = count || 0;
    }

    return NextResponse.json({
      found: true,
      status: application.status,
      referralCode: application.status === 'approved' ? application.referral_code : null,
      partnerType: application.partner_type,
      appliedAt: application.created_at,
      referralCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[Partners] Status error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
