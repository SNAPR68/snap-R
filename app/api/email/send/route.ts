export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { emailSendSchema, parseBody } from '@/lib/validation/schemas';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = parseBody(emailSendSchema, body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error, details: parsed.details },
        { status: 400 }
      );
    }

    const { to, subject, html, text, listingId, emailType, replyTo } = parsed.data;

    // Check plan tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';

    if (tier === 'free' || tier === 'starter') {
      return NextResponse.json(
        { error: 'Email sending requires a Pro or Agency plan' },
        { status: 403 }
      );
    }

    // Verify RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      logger.error('[Email Send] RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send to each recipient individually to avoid exposing recipient list
    let successCount = 0;
    let lastMessageId = '';
    const errors: string[] = [];

    for (const recipient of to) {
      try {
        const { data, error: sendError } = await resend.emails.send({
          from: 'SnapR <notifications@snap-r.com>',
          to: recipient,
          subject,
          html,
          ...(text ? { text } : {}),
          ...(replyTo ? { reply_to: replyTo } : {}),
        });

        if (sendError) {
          errors.push(`${recipient}: ${sendError.message}`);
        } else if (data?.id) {
          lastMessageId = data.id;
          successCount++;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown send error';
        errors.push(`${recipient}: ${message}`);
      }
    }

    if (successCount === 0) {
      return NextResponse.json(
        { error: `Failed to send to all recipients: ${errors.join('; ')}` },
        { status: 500 }
      );
    }

    // Log successful send
    logger.info(
      '[Email Send]',
      `type=${emailType ?? 'general'}`,
      `sent=${successCount}/${to.length}`,
      `listing=${listingId ?? 'none'}`,
      `user=${user.id}`,
      `tier=${tier}`
    );

    if (errors.length > 0) {
      logger.warn('[Email Send] Partial failures:', errors.join('; '));
    }

    return NextResponse.json({
      success: true,
      messageId: lastMessageId,
      recipientCount: successCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[Email Send] Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
