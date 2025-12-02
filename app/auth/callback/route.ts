import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if new user (profile doesn't exist or was just created)
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', data.user.id)
        .single();

      // Send welcome email for new users (created in last 5 minutes)
      if (profile) {
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - createdAt.getTime()) < 5 * 60 * 1000; // 5 minutes

        if (isNewUser && data.user.email) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: 'SnapR <onboarding@resend.dev>',
              to: data.user.email,
              subject: 'Welcome to SnapR! 🎉',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #D4A017;">Welcome to SnapR!</h1>
                  <p>Thanks for signing up. You've got <strong>10 free credits</strong> to try our AI photo enhancement tools.</p>
                  <h3>What you can do:</h3>
                  <ul>
                    <li>🌅 Sky Replacement - Transform dull skies instantly</li>
                    <li>🌙 Virtual Twilight - Create stunning dusk shots</li>
                    <li>🌿 Lawn Repair - Make grass green and lush</li>
                    <li>🛋️ Virtual Staging - Furnish empty rooms</li>
                    <li>✨ HDR Enhancement - Professional color correction</li>
                  </ul>
                  <p><a href="https://snap-r.com/dashboard" style="display: inline-block; background: linear-gradient(to right, #D4A017, #B8860B); color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Enhancing Photos →</a></p>
                  <p style="color: #666; margin-top: 30px;">Need help? Check out our <a href="https://snap-r.com/academy">Academy</a> or reply to this email.</p>
                  <p style="color: #999;">- The SnapR Team</p>
                </div>
              `,
            });
          } catch (emailError) {
            console.error('Welcome email error:', emailError);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
