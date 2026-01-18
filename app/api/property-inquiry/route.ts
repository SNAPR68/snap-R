import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message, listingId, listingAddress, agentEmail } = body
    
    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    
    // If we have an agent email, send to them
    // Otherwise, send to the default support email
    const recipientEmail = agentEmail || process.env.DEFAULT_NOTIFICATION_EMAIL || 'support@snap-r.com'
    
    // Send email to agent
    const { data, error } = await resend.emails.send({
      from: 'SnapR Property Inquiries <noreply@snap-r.com>',
      to: [recipientEmail],
      replyTo: email,
      subject: `New Inquiry: ${listingAddress || 'Your Property Listing'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #D4A017; font-size: 24px; margin: 0;">New Property Inquiry</h1>
            </div>
            
            <!-- Property Info -->
            ${listingAddress ? `
            <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
              <p style="color: #888; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Property</p>
              <p style="color: #fff; font-size: 18px; margin: 0; font-weight: 600;">${listingAddress}</p>
            </div>
            ` : ''}
            
            <!-- Contact Info -->
            <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
              <h2 style="color: #D4A017; font-size: 16px; margin: 0 0 16px 0;">Contact Information</h2>
              
              <div style="margin-bottom: 12px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Name</p>
                <p style="color: #fff; font-size: 16px; margin: 0;">${name}</p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Email</p>
                <p style="color: #fff; font-size: 16px; margin: 0;">
                  <a href="mailto:${email}" style="color: #D4A017; text-decoration: none;">${email}</a>
                </p>
              </div>
              
              ${phone ? `
              <div>
                <p style="color: #888; font-size: 12px; margin: 0 0 4px 0;">Phone</p>
                <p style="color: #fff; font-size: 16px; margin: 0;">
                  <a href="tel:${phone}" style="color: #D4A017; text-decoration: none;">${phone}</a>
                </p>
              </div>
              ` : ''}
            </div>
            
            <!-- Message -->
            <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
              <h2 style="color: #D4A017; font-size: 16px; margin: 0 0 16px 0;">Message</h2>
              <p style="color: #fff; font-size: 16px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #D4A017 0%, #B8860B 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reply to ${name}
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #333;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This inquiry was sent via your SnapR property page.
              </p>
              <p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">
                <a href="https://snap-r.com" style="color: #D4A017; text-decoration: none;">snap-r.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
    
    if (error) {
      console.error('[Property Inquiry] Email error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
    
    // Also send confirmation to the inquirer
    try {
      await resend.emails.send({
        from: 'SnapR <noreply@snap-r.com>',
        to: [email],
        subject: `Your inquiry about ${listingAddress || 'the property'} has been sent`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #D4A017; font-size: 24px; margin: 0;">Thanks for Your Inquiry!</h1>
              </div>
              
              <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                <p style="color: #fff; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">
                  Hi ${name},
                </p>
                <p style="color: #fff; font-size: 16px; margin: 0 0 16px 0; line-height: 1.6;">
                  We've received your inquiry about <strong>${listingAddress || 'the property'}</strong> and forwarded it to the listing agent.
                </p>
                <p style="color: #fff; font-size: 16px; margin: 0; line-height: 1.6;">
                  They'll be in touch with you soon!
                </p>
              </div>
              
              <div style="background-color: #1A1A1A; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #333;">
                <h2 style="color: #D4A017; font-size: 16px; margin: 0 0 16px 0;">Your Message</h2>
                <p style="color: #888; font-size: 14px; margin: 0; line-height: 1.6; font-style: italic;">"${message}"</p>
              </div>
              
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #333;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  <a href="https://snap-r.com" style="color: #D4A017; text-decoration: none;">Powered by SnapR</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    } catch (confirmError) {
      // Log but don't fail if confirmation email fails
      console.error('[Property Inquiry] Confirmation email error:', confirmError)
    }
    
    console.log('[Property Inquiry] Email sent successfully:', data?.id)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[Property Inquiry] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
