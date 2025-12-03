import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, credits } = session.metadata || {};

    if (userId && credits) {
      const creditsToAdd = parseInt(credits);
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      await supabaseAdmin
        .from('users')
        .update({ credits: (user?.credits || 0) + creditsToAdd })
        .eq('id', userId);

      console.log(`Added ${creditsToAdd} credits to user ${userId}`);
    }
  }

  
    // Handle failed payments
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      
      if (customerEmail && process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'SnapR <onboarding@resend.dev>',
          to: customerEmail,
          subject: '⚠️ Payment Failed - Action Required',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #D4A017;">Payment Failed</h2>
              <p>We were unable to process your subscription payment.</p>
              <p>Please update your payment method to continue using SnapR without interruption.</p>
              <p><a href="https://snap-r.com/dashboard/billing" style="display: inline-block; background: linear-gradient(to right, #D4A017, #B8860B); color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Update Payment Method →</a></p>
              <p style="color: #666; margin-top: 20px;">If you have questions, contact support@snap-r.com</p>
            </div>
          `,
        });
        
        // Alert admin
        await resend.emails.send({
          from: 'SnapR Alerts <onboarding@resend.dev>',
          to: 'rajesh@snap-r.com',
          subject: '⚠️ Payment Failed: ' + customerEmail,
          html: '<p>Customer payment failed: ' + customerEmail + '</p>',
        });
      }
    }

    return NextResponse.json({ received: true });
}
