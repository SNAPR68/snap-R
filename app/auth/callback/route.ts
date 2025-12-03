import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, plan, created_at')
        .eq('id', data.user.id)
        .single();

      // If no profile, create one (Google sign up doesn't trigger the database function)
      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            plan: 'free',
            credits: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Profile creation error:', insertError);
        }

        // New user - send welcome email and redirect to onboarding
        if (data.user.email) {
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
                    <li>�� Lawn Repair - Make grass green and lush</li>
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

        // Redirect new users to onboarding/pricing
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Existing user - check if they have a plan
      if (profile.plan === 'free' || !profile.plan) {
        // User exists but no paid plan - check if this is from a specific "next" destination
        if (next) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        // Otherwise go to dashboard (they already have 10 free credits)
        return NextResponse.redirect(`${origin}/dashboard`);
      }

      // Existing user with plan - go to requested page or dashboard
      return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
