/**
 * POST /api/showing/feedback — Public showing feedback submission
 * No auth required — uses showing UUID as a public token
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminSupabase } from '@/lib/supabase/admin';
import { Resend } from 'resend';

import { logger } from '@/lib/logger';
const feedbackSchema = z.object({
  showingId: z.string().uuid('Invalid showing ID'),
  interestLevel: z.number().int().min(1).max(5),
  comments: z.string().max(2000).optional(),
  wantsFollowUp: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { showingId, interestLevel, comments, wantsFollowUp } = parsed.data;
    const supabase = adminSupabase();

    // Fetch showing to verify it exists and get agent email for notification
    const { data: showing, error: lookupError } = await supabase
      .from('showings')
      .select('id, contact_name, user_id, listing_id, listings(address, city, state, title)')
      .eq('id', showingId)
      .single();

    if (lookupError || !showing) {
      return NextResponse.json({ error: 'Showing not found' }, { status: 404 });
    }

    // Save feedback
    const { error: updateError } = await supabase
      .from('showings')
      .update({
        interest_level: interestLevel,
        feedback: comments ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', showingId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    // Notify agent via email (non-blocking)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', showing.user_id)
        .single();

      const agentEmail = profile?.email;
      const listingData = showing.listings as { address?: string; city?: string; state?: string; title?: string } | null;
      const propertyLabel = listingData?.address
        ? `${listingData.address}${listingData.city ? `, ${listingData.city}` : ''}`
        : 'your listing';

      const ratingEmojis = ['', '😐', '🙁', '😊', '😃', '🤩'];
      const ratingLabel = ['', 'Not interested', 'Somewhat interested', 'Interested', 'Very interested', 'Ready to offer'][interestLevel] || '';

      if (agentEmail) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'SnapR Showings <noreply@snap-r.com>',
          to: [agentEmail],
          subject: `Showing feedback from ${showing.contact_name} — ${propertyLabel}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
                <h1 style="color:#D4A017;font-size:22px;margin:0 0 24px 0;">Showing Feedback Received</h1>
                <div style="background:#1A1A1A;border-radius:12px;padding:24px;margin-bottom:20px;border:1px solid #333;">
                  <p style="color:#888;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;">Property</p>
                  <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 16px 0;">${propertyLabel}</p>
                  <p style="color:#888;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;">Buyer</p>
                  <p style="color:#fff;font-size:16px;margin:0 0 16px 0;">${showing.contact_name}</p>
                  <p style="color:#888;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;">Interest Level</p>
                  <p style="color:#fff;font-size:20px;margin:0 0 4px 0;">${ratingEmojis[interestLevel]} ${ratingLabel}</p>
                  <div style="display:flex;gap:4px;margin-bottom:16px;">
                    ${[1,2,3,4,5].map(i => `<div style="width:32px;height:8px;border-radius:4px;background:${i <= interestLevel ? '#D4A017' : '#333'};"></div>`).join('')}
                  </div>
                  ${comments ? `
                  <p style="color:#888;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;">Comments</p>
                  <p style="color:#fff;font-size:15px;margin:0;font-style:italic;">&ldquo;${comments}&rdquo;</p>
                  ` : ''}
                  ${wantsFollowUp ? `<p style="color:#D4A017;font-size:13px;margin:16px 0 0 0;">&#10003; Buyer requested a follow-up</p>` : ''}
                </div>
                <a href="https://snap-r.com/dashboard/showings" style="display:inline-block;padding:12px 24px;background:#D4A017;color:#000;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View in Dashboard</a>
                <p style="color:#555;font-size:12px;margin:24px 0 0 0;">Powered by <a href="https://snap-r.com" style="color:#D4A017;text-decoration:none;">SnapR</a></p>
              </div>
            </body>
            </html>
          `,
        });
      }
    } catch {
      // Email failure is non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[ShowingFeedback]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
