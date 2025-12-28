import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { shareToken, clientName } = await req.json();

    const { data: share } = await supabase
      .from('shares')
      .select('*')
      .eq('token', shareToken)
      .single();

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', share.listing_id)
      .single();

    const { data: owner } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', share.user_id)
      .single();

    if (!owner?.email) {
      return NextResponse.json({ error: 'Owner email not found' }, { status: 404 });
    }

    const { data: photos } = await supabase
      .from('photos')
      .select('client_approved')
      .eq('listing_id', share.listing_id)
      .eq('status', 'completed');

    const approved = photos?.filter(p => p.client_approved === true).length || 0;
    const rejected = photos?.filter(p => p.client_approved === false).length || 0;
    const total = photos?.length || 0;
    const listingTitle = listing?.title || 'Your Listing';

    await resend.emails.send({
      from: 'SnapR <notifications@snap-r.com>',
      to: owner.email,
      subject: `📸 Client Review Submitted - ${listingTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://snap-r.com/snapr-logo.png" alt="SnapR" style="width: 60px; height: 60px;">
          </div>
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Client Review Complete!</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            ${clientName ? `<strong>${clientName}</strong> has` : 'Your client has'} reviewed the photos for <strong>${listingTitle}</strong>.
          </p>
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #D4A017; font-size: 18px; margin: 0 0 16px 0;">Review Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="text-align: center; padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                  <div style="color: #10b981; font-size: 32px; font-weight: bold;">${approved}</div>
                  <div style="color: #9ca3af; font-size: 14px;">Approved</div>
                </td>
                <td style="width: 10px;"></td>
                <td style="text-align: center; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                  <div style="color: #ef4444; font-size: 32px; font-weight: bold;">${rejected}</div>
                  <div style="color: #9ca3af; font-size: 14px;">Rejected</div>
                </td>
                <td style="width: 10px;"></td>
                <td style="text-align: center; padding: 16px; background: rgba(212, 160, 23, 0.1); border-radius: 8px;">
                  <div style="color: #D4A017; font-size: 32px; font-weight: bold;">${total}</div>
                  <div style="color: #9ca3af; font-size: 14px;">Total</div>
                </td>
              </tr>
            </table>
          </div>
          <a href="https://snap-r.com/dashboard/studio?id=${share.listing_id}" style="display: block; text-align: center; background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%); color: #000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">
            View in Studio
          </a>
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 30px;">
            You can download approved photos directly from the Studio.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} SnapR. All rights reserved.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
