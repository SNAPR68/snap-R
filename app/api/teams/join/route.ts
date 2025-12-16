import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Accept invite via token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_token', req.url));
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirect to login with return URL
      return NextResponse.redirect(new URL(`/auth/login?redirect=/api/teams/join?token=${token}`, req.url));
    }

    // Find valid invite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select('id, team_id, email, role, expires_at, used_at, teams(name)')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.redirect(new URL('/dashboard?error=invite_not_found', req.url));
    }

    if (invite.used_at) {
      return NextResponse.redirect(new URL('/dashboard?error=invite_already_used', req.url));
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/dashboard?error=invite_expired', req.url));
    }

    // Get user's email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    // Check if invite email matches (optional - can be removed for open invites)
    // if (profile?.email?.toLowerCase() !== invite.email.toLowerCase()) {
    //   return NextResponse.redirect(new URL('/dashboard?error=email_mismatch', req.url));
    // }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invite.team_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.redirect(new URL(`/dashboard/team?id=${invite.team_id}&message=already_member`, req.url));
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invite.team_id,
        user_id: user.id,
        role: invite.role
      });

    if (memberError) {
      console.error('Join team error:', memberError);
      return NextResponse.redirect(new URL('/dashboard?error=join_failed', req.url));
    }

    // Mark invite as used
    await supabase
      .from('team_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id);

    // Set as current team
    await supabase
      .from('profiles')
      .update({ current_team_id: invite.team_id })
      .eq('id', user.id);

    return NextResponse.redirect(new URL(`/dashboard/team?id=${invite.team_id}&joined=true`, req.url));
  } catch (error) {
    console.error('Join team error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', req.url));
  }
}
