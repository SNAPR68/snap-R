export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { photoUrl, listingId, instructions, isUrgent, userEmail } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .single();

    await resend.emails.send({
      from: 'SnapR Orders <onboarding@resend.dev>',
      to: 'sales@snap-r.com',
      subject: `${isUrgent ? '🚨 URGENT: ' : ''}Human Edit Request - ${listing?.title || listingId}`,
      html: `
        <h2>New Human Edit Request</h2>
        <p><strong>Priority:</strong> ${isUrgent ? '🚨 URGENT (24hr)' : 'Standard (48hr)'}</p>
        <p><strong>Listing:</strong> ${listing?.title || listingId}</p>
        <p><strong>Customer Email:</strong> ${userEmail || user.email}</p>
        <p><strong>Instructions:</strong></p>
        <p>${instructions || 'No special instructions'}</p>
        <p><strong>Photo:</strong></p>
        <img src="${photoUrl}" style="max-width: 600px; border-radius: 8px;" />
        <hr />
        <p>Listing ID: ${listingId}</p>
        <p>User ID: ${user.id}</p>
      `,
    });

    await resend.emails.send({
      from: 'SnapR <onboarding@resend.dev>',
      to: userEmail || user.email,
      subject: 'Your Human Edit Request Received',
      html: `
        <h2>We've received your edit request!</h2>
        <p>Our professional editors will ${isUrgent ? 'prioritize your request and deliver within 24 hours' : 'deliver within 48 hours'}.</p>
        <p><strong>Listing:</strong> ${listing?.title || 'Your property'}</p>
        <p>We'll email you when it's ready.</p>
        <br/>
        <p>Thank you for using SnapR!</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Human editor error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
