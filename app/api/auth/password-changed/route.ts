export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { logger } from '@/lib/logger';
/**
 * POST /api/auth/password-changed
 *
 * Sends a security notification email after a successful password change.
 * Called from the reset-password page after `supabase.auth.updateUser()`.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: only send once per 5 minutes to prevent abuse
    const cacheKey = `pw_changed_${user.id}`;
    const { data: recent } = await supabase
      .from('system_logs')
      .select('id')
      .eq('source', cacheKey)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (recent) {
      return NextResponse.json({ sent: false, reason: 'rate_limited' });
    }

    // Get user agent from request for context
    const userAgent = request.headers.get('user-agent') || 'Unknown browser';
    const now = new Date();

    const { Resend } = await import('resend');
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ sent: false, reason: 'email_not_configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'SnapR Security <notifications@snap-r.com>',
      to: user.email,
      subject: 'Your SnapR password was changed',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
          <div style="padding:40px 32px">
            <div style="text-align:center;margin-bottom:32px">
              <h1 style="font-size:24px;margin:0">Snap<span style="color:#D4A017">R</span></h1>
            </div>

            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:16px;margin-bottom:24px">
              <p style="margin:0;color:#fca5a5;font-size:14px;font-weight:600">🔒 Password Changed</p>
            </div>

            <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin-bottom:16px">
              Your SnapR account password was successfully changed on <strong style="color:#fff">${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> at <strong style="color:#fff">${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</strong>.
            </p>

            <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin-bottom:24px">
              If you made this change, no further action is needed.
            </p>

            <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;margin-bottom:24px">
              <p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px">
                <strong>Device:</strong> ${userAgent.slice(0, 120)}
              </p>
            </div>

            <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:16px;margin-bottom:24px">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;line-height:1.6">
                <strong style="color:#fca5a5">Didn&apos;t change your password?</strong> Your account may be compromised.
                <a href="https://snap-r.com/auth/forgot-password" style="color:#D4A017;text-decoration:none;font-weight:600">Reset it now</a>
                or contact <a href="mailto:support@snap-r.com" style="color:#D4A017;text-decoration:none">support@snap-r.com</a> immediately.
              </p>
            </div>

            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0">
            <p style="font-size:12px;color:rgba(255,255,255,0.2);text-align:center;margin:0">
              SnapR · AI Real Estate Photo Enhancement · This is a security notification and cannot be unsubscribed.
            </p>
          </div>
        </div>
      `,
    });

    // Log for rate limiting
    await supabase.from('system_logs').insert({
      level: 'info',
      source: cacheKey,
      message: 'Password changed notification sent',
      metadata: { userId: user.id, timestamp: now.toISOString() },
    });

    return NextResponse.json({ sent: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send notification';
    logger.error('[password-changed] Error:', message);
    return NextResponse.json({ sent: false, error: message }, { status: 500 });
  }
}
