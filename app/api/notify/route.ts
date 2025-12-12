export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabase.from('ios_waitlist').insert({
      email,
      created_at: new Date().toISOString(),
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR <onboarding@resend.dev>',
      to: 'support@snap-r.com',
      subject: `iOS Waitlist Signup: ${email}`,
      html: `
        <h2>New iOS Waitlist Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    await resend.emails.send({
      from: 'SnapR <onboarding@resend.dev>',
      to: email,
      subject: "You're on the SnapR iOS waitlist!",
      html: `
        <h2>Thanks for joining the waitlist!</h2>
        <p>We'll notify you as soon as SnapR for iPhone is available on the App Store.</p>
        <p>In the meantime, try our web app at <a href="https://snap-r.com">snap-r.com</a></p>
        <br/>
        <p>— The SnapR Team</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notify API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
