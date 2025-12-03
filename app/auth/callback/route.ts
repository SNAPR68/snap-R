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
        .select('id, subscription_tier, created_at')
        .eq('id', data.user.id)
        .single();

      // If no profile, create one
      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          subscription_tier: 'free',
          credits: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Send welcome email
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
                  <p>You've got <strong>10 free credits</strong> to try our AI photo enhancement tools.</p>
                  <p><a href="https://snap-r.com/dashboard" style="background: linear-gradient(to right, #D4A017, #B8860B); color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Enhancing →</a></p>
                </div>
              `,
            });
          } catch (e) { console.error('Welcome email error:', e); }
        }
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
