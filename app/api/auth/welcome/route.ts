/**
 * POST /api/auth/welcome
 * Send a welcome email to a newly signed-up user.
 * Called server-side from the auth callback after profile creation.
 * Uses the admin client — no user session required (callback context).
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { authWelcomeSchema, parseBody } from '@/lib/validation/schemas'

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  // Internal-only: validate caller with CRON_SECRET (reuses same secret for internal APIs)
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json(); const validated = parseBody(authWelcomeSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }

    const firstName = name ? name.split(' ')[0] : 'there';

    await resend.emails.send({
      from: 'SnapR <hello@snap-r.com>',
      to: email,
      subject: 'Welcome to SnapR — your AI photo studio is ready',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <!-- Logo -->
    <div style="margin-bottom:32px">
      <span style="font-size:28px;font-weight:700;color:#D4A017">Snap</span><span style="font-size:28px;font-weight:700;color:#ffffff">R</span>
    </div>

    <!-- Hero -->
    <h1 style="font-size:32px;font-weight:700;color:#ffffff;margin:0 0 16px">
      Welcome, ${firstName} 👋
    </h1>
    <p style="font-size:16px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 32px">
      Your AI photo studio is ready. Here's how to get your first listing live in under 10 minutes.
    </p>

    <!-- Steps -->
    <div style="background:#1A1A1A;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:32px">
      <div style="margin-bottom:20px;display:flex;align-items:flex-start;gap:16px">
        <div style="width:32px;height:32px;border-radius:50%;background:#D4A017;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#000;font-size:14px;text-align:center;line-height:32px">1</div>
        <div>
          <p style="font-weight:600;color:#fff;margin:0 0 4px">Upload your listing photos</p>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0">Create a new listing and upload your raw property photos.</p>
        </div>
      </div>
      <div style="margin-bottom:20px;display:flex;align-items:flex-start;gap:16px">
        <div style="width:32px;height:32px;border-radius:50%;background:#D4A017;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#000;font-size:14px;text-align:center;line-height:32px">2</div>
        <div>
          <p style="font-weight:600;color:#fff;margin:0 0 4px">Let AI prepare the listing</p>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0">Click Prepare — SnapR enhances every photo and auto-generates your marketing package.</p>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:16px">
        <div style="width:32px;height:32px;border-radius:50%;background:#D4A017;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;color:#000;font-size:14px;text-align:center;line-height:32px">3</div>
        <div>
          <p style="font-weight:600;color:#fff;margin:0 0 4px">Publish and share</p>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0">MLS description, social captions, scheduled posts — all done automatically.</p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:40px">
      <a href="https://snap-r.com/listings/new?guided=true"
         style="display:inline-block;background:linear-gradient(135deg,#D4A017,#B8860B);color:#000;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none">
        Upload Your First Listing →
      </a>
    </div>

    <!-- Support -->
    <p style="font-size:14px;color:rgba(255,255,255,0.4);text-align:center;margin:0">
      Questions? Reply to this email or visit <a href="https://snap-r.com" style="color:#D4A017;text-decoration:none">snap-r.com</a>
    </p>

    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0">
    <p style="font-size:12px;color:rgba(255,255,255,0.2);text-align:center;margin:0">
      SnapR · AI Real Estate Photo Enhancement · <a href="https://snap-r.com/unsubscribe" style="color:rgba(255,255,255,0.2)">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({ sent: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
