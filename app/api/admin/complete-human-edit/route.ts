export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const ADMIN_EMAILS = ['rajesh@snap-r.com'];

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { orderId, userEmail } = await request.json();

    // Update order status
    await supabase
      .from('human_edit_orders')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Notify customer
    if (userEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SnapR <notifications@snap-r.com>',
        to: userEmail,
        subject: '✅ Your Human Edit is Complete!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D4A017;">Your Edit is Ready!</h2>
            <p>Great news! Our team has completed your manual photo edit.</p>
            <p><a href="https://snap-r.com/dashboard" style="display: inline-block; background: linear-gradient(to right, #D4A017, #B8860B); color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Photos →</a></p>
            <p style="color: #666; margin-top: 20px;">Thank you for using SnapR!</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
