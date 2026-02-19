export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/utils/html-escape';

export async function POST(request: NextRequest) {
  // Admin auth — match pattern from users/export
  const authHeader = request.headers.get('authorization');
  if (!process.env.ADMIN_SECRET || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = adminSupabase();
    const { orderId, userEmail } = await request.json();

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('human_edit_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[CompleteHumanEdit] Update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Notify customer
    if (userEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const safeEmail = escapeHtml(String(userEmail));
      await resend.emails.send({
        from: 'SnapR <notifications@snap-r.com>',
        to: safeEmail,
        subject: 'Your Human Edit is Complete!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D4A017;">Your Edit is Ready!</h2>
            <p>Great news! Our team has completed your manual photo edit.</p>
            <p><a href="https://snap-r.com/dashboard" style="display: inline-block; background: linear-gradient(to right, #D4A017, #B8860B); color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Photos</a></p>
            <p style="color: #666; margin-top: 20px;">Thank you for using SnapR!</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CompleteHumanEdit] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
