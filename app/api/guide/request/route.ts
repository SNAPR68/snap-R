export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminSupabase } from '@/lib/supabase/admin';
import { guideRequestSchema, parseBody } from '@/lib/validation/schemas';
import { renderToBuffer } from '@react-pdf/renderer';
import { MarketingGuideDocument } from '@/lib/print/guide-template';
import { generateQrCodeDataUri } from '@/lib/print/pdf-utils';

import { logger } from '@/lib/logger';
import { checkRateLimitAsync } from '@/lib/rate-limit';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com';

// Module-level cache — persists across warm invocations
let cachedPdfBuffer: Buffer | null = null;

async function getGuideBuffer(): Promise<Buffer> {
  if (cachedPdfBuffer) return cachedPdfBuffer;

  const qrCode = await generateQrCodeDataUri(`${BASE_URL}/auth/signup`);
  const buffer = await renderToBuffer(
    MarketingGuideDocument({ qrCodeDataUri: qrCode })
  );
  cachedPdfBuffer = Buffer.from(buffer);
  return cachedPdfBuffer;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 req/min per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success: withinLimit } = await checkRateLimitAsync(`guide-request:${ip}`, 3, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = parseBody(guideRequestSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const { email, name, source } = parsed.data;

    // Generate or retrieve cached PDF
    const pdfBuffer = await getGuideBuffer();

    // Save to contact_submissions
    const supabase = adminSupabase();
    await supabase.from('contact_submissions').insert({
      name: name || 'Guide Request',
      email,
      message: `guide_request:${source || 'unknown'}`,
      status: 'new',
    });

    // Send email with PDF attachment
    if (!process.env.RESEND_API_KEY) {
      logger.error('[GuideRequest] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR <notifications@snap-r.com>',
      to: email,
      subject: 'Your SnapR Real Estate Marketing Guide',
      html: buildGuideEmail(name),
      attachments: [
        {
          filename: 'snapr-real-estate-marketing-guide.pdf',
          content: pdfBuffer,
        },
      ],
    });

    // Also notify team
    await resend.emails.send({
      from: 'SnapR <notifications@snap-r.com>',
      to: 'support@snap-r.com',
      subject: `Guide requested: ${email}`,
      html: `<p><strong>Name:</strong> ${name || 'Not provided'}</p><p><strong>Email:</strong> ${email}</p><p><strong>Source:</strong> ${source || 'unknown'}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[GuideRequest] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildGuideEmail(name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a1a1a; border-radius: 16px; border: 1px solid #D4A01733; overflow: hidden;">
          <!-- Gold accent bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, transparent, #D4A017, transparent);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <div style="font-size: 28px; font-weight: 800; letter-spacing: 1px;">
                <span style="color: #ffffff;">Snap</span><span style="color: #D4A017;">R</span>
              </div>
              <p style="color: #666; font-size: 11px; margin: 4px 0 0; letter-spacing: 1px; text-transform: uppercase;">AI-Powered Real Estate Media</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="color: #D4A017; font-size: 22px; font-weight: 700; margin: 0 0 16px; line-height: 1.3;">
                Your Marketing Guide is Here
              </h1>
              <div style="color: #cccccc; font-size: 15px; line-height: 1.6;">
                <p style="margin: 0 0 12px;">${greeting}</p>
                <p style="margin: 0 0 12px;">Thank you for your interest in SnapR. Your copy of <strong style="color: #ffffff;">The Real Estate Photo Marketing Guide</strong> is attached to this email.</p>
                <p style="margin: 0 0 12px;">Inside you will find:</p>
                <ul style="margin: 0 0 16px; padding-left: 20px; color: #cccccc;">
                  <li style="margin-bottom: 6px;">Why professional photos sell listings 32% faster</li>
                  <li style="margin-bottom: 6px;">The 5-step AI-powered marketing workflow</li>
                  <li style="margin-bottom: 6px;">Platform-specific social media strategies</li>
                  <li style="margin-bottom: 6px;">How to track analytics and measure ROI</li>
                </ul>
                <p style="margin: 0;">Ready to put these strategies into action?</p>
              </div>

              <!-- CTA Button -->
              <a href="${BASE_URL}/auth/signup" style="display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #D4A017, #B8860B); color: #000; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">
                Start Free with SnapR &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">
                <a href="${BASE_URL}" style="color: #D4A017; text-decoration: none;">Visit SnapR</a>
                &nbsp;&middot;&nbsp;
                <a href="${BASE_URL}/faq" style="color: #888888; text-decoration: none;">FAQ</a>
                &nbsp;&middot;&nbsp;
                <a href="${BASE_URL}/academy" style="color: #888888; text-decoration: none;">Academy</a>
              </p>
              <p style="color: #555555; font-size: 11px; margin: 12px 0 0; text-align: center;">
                &copy; 2026 SnapR. AI-powered real estate media &amp; marketing.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
