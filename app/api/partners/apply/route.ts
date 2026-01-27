import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, partner_type, company, message } = body;

    // Validate required fields
    if (!name || !email || !partner_type) {
      return NextResponse.json(
        { error: 'Name, email, and partner type are required' },
        { status: 400 }
      );
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('partner_applications')
      .insert({
        name,
        email,
        partner_type,
        company: company || null,
        message: message || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save application' },
        { status: 500 }
      );
    }

    // Send email notification
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SnapR <notifications@snap-r.com>',
          to: 'rajesh@snap-r.com',
          subject: `New Partner Application: ${name}`,
          html: `
            <h2>New Partner Application</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Type:</strong> ${partner_type}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Message:</strong> ${message || 'Not provided'}</p>
            <br/>
            <p><a href="https://snap-r.com/admin/partners">View in Dashboard</a></p>
          `,
        }),
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Email notification failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      id: data.id,
    });

  } catch (error) {
    console.error('Partner application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
