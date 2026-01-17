import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const body = await request.json()
    
    const { 
      name, 
      email, 
      phone, 
      message, 
      listingId, 
      listingTitle, 
      listingAddress,
      agentEmail,
      agentName 
    } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send email to agent (or fallback to support)
    const toEmail = agentEmail || 'support@snap-r.com'
    
    await resend.emails.send({
      from: 'SnapR Property Inquiry <notifications@snap-r.com>',
      to: toEmail,
      replyTo: email,
      subject: `New Inquiry: ${listingTitle || 'Property Listing'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #D4A017, #B8860B); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏠 New Property Inquiry</h1>
          </div>
          
          <div style="background: #1a1a1a; color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #D4A017; margin-top: 0;">Property Details</h2>
            <p style="color: #cccccc;"><strong>Listing:</strong> ${listingTitle || 'N/A'}</p>
            <p style="color: #cccccc;"><strong>Address:</strong> ${listingAddress || 'N/A'}</p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
            
            <h2 style="color: #D4A017;">Contact Information</h2>
            <p style="color: #cccccc;"><strong>Name:</strong> ${name}</p>
            <p style="color: #cccccc;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #D4A017;">${email}</a></p>
            <p style="color: #cccccc;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
            
            <h2 style="color: #D4A017;">Message</h2>
            <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; border-left: 4px solid #D4A017;">
              <p style="color: #ffffff; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">
            
            <p style="color: #888888; font-size: 12px;">
              This inquiry was submitted through your SnapR property page.
              <br>Reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Property inquiry error:', error)
    return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 })
  }
}
