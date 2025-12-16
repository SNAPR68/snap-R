import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - List pending invites
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: invites, error } = await supabase
      .from('team_invites')
      .select('id, email, role, created_at, expires_at')
      .eq('team_id', id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role = 'editor' } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user is already a member
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', id)
        .eq('user_id', existingProfile.id)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('team_invites')
      .select('id')
      .eq('team_id', id)
      .eq('email', email.toLowerCase())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent to this email' }, { status: 400 });
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from('team_invites')
      .insert({
        team_id: id,
        email: email.toLowerCase(),
        role,
        invited_by: user.id
      })
      .select('id, email, role, token, created_at, expires_at')
      .single();

    if (error) {
      console.error('Create invite error:', error);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/teams/join?token=${invite.token}`;

    return NextResponse.json({ invite: { ...invite, url: inviteUrl } });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Cancel invite
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteId } = await req.json();

    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId)
      .eq('team_id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel invite error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
