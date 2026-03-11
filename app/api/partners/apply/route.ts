import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { partnerApplySchema } from '@/lib/validation/schemas';
import { checkRateLimitAsync } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';

function generateReferralCode(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6).padEnd(4, 'x');
  const random = Math.random().toString(16).slice(2, 6);
  return `snap-${slug}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 req/hour per IP (uses Upstash Redis in production)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success: withinLimit } = await checkRateLimitAsync(`partners-apply:${ip}`, 3, 3_600_000);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = adminSupabase();
    const rawBody = await request.json();
    const parsed = partnerApplySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, phone, company, website, partner_type, audience_size, message } = parsed.data;

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('partner_applications')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists. Check your email for confirmation details.' },
        { status: 409 }
      );
    }

    // Generate referral code with retry on collision
    let referralCode = generateReferralCode(name);
    let retries = 3;

    let data = null;
    let insertError = null;

    while (retries > 0) {
      const result = await supabase
        .from('partner_applications')
        .insert([{
          name,
          email,
          phone: phone || null,
          company: company || null,
          website: website || null,
          partner_type,
          audience_size: audience_size || null,
          message: message || null,
          status: 'pending',
          referral_code: referralCode,
        }])
        .select()
        .single();

      if (result.error) {
        // If unique constraint violation on referral_code, retry with new code
        if (result.error.code === '23505' && result.error.message.includes('referral_code')) {
          referralCode = generateReferralCode(name);
          retries--;
          continue;
        }
        insertError = result.error;
        break;
      }

      data = result.data;
      break;
    }

    if (insertError || !data) {
      logger.error('Supabase error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Send confirmation email via Resend (non-blocking)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SnapR Partners <partners@snap-r.com>',
            to: [email],
            subject: 'SnapR Partner Application Received',
            html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #D4A017; margin: 0; font-size: 28px;">SnapR</h1>
                <p style="color: #666; margin: 4px 0 0;">Partner Program</p>
              </div>
              <h2 style="color: #333; margin-bottom: 16px;">Thanks for applying, ${name}!</h2>
              <p style="color: #555; line-height: 1.6;">We've received your SnapR Partner Program application. Our team reviews applications within 24-48 hours.</p>
              <p style="color: #555; line-height: 1.6;">Once approved, you'll receive:</p>
              <ul style="color: #555; line-height: 1.8;">
                <li>Your unique referral link</li>
                <li>Access to your Partner Dashboard</li>
                <li>20% recurring commission on every referral</li>
              </ul>
              <p style="color: #999; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
                Application ID: ${data.id}<br/>
                Applied as: ${partner_type}
              </p>
            </div>`,
          }),
                  signal: AbortSignal.timeout(15000),
        });
        logger.info('[Partners] Confirmation email sent to:', email);
      } catch (emailErr) {
        logger.error('[Partners] Confirmation email failed:', emailErr);
        // Don't fail the request if email fails
      }
    }

    logger.info('[Partners] Application submitted:', data.id, 'referral:', referralCode);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      id: data.id,
    });

  } catch (error: unknown) {
    logger.error('Partner application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
