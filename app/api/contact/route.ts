export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminSupabase } from '@/lib/supabase/admin';
import { escapeHtml } from '@/lib/utils/html-escape';
import { contactSchema, parseBody } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = parseBody(contactSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const { name, email, message } = parsed.data;

    // Save to database
    const supabase = adminSupabase();

    await supabase.from('contact_submissions').insert({
      name,
      email,
      message,
      status: 'new',
    });

    // Send email with escaped HTML to prevent XSS
    const safeName = escapeHtml(String(name));
    const safeEmail = escapeHtml(String(email));
    const safeMessage = escapeHtml(String(message));

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR Contact <notifications@snap-r.com>',
      to: 'support@snap-r.com',
      replyTo: email,
      subject: `New Contact: ${safeName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Contact form error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
