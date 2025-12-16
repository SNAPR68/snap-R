import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - List team members
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, role, joined_at, user_id, profiles(id, email, full_name, avatar_url)')
      .eq('team_id', id)
      .order('joined_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Remove member from team
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    // Check if requester is admin/owner
    const { data: requesterMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', user.id)
      .single();

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      // Allow users to remove themselves
      if (userId !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    // Prevent removing owner
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', userId)
      .single();

    if (targetMember?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 });
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Update member role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = await req.json();

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if requester is admin/owner
    const { data: requesterMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', user.id)
      .single();

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Prevent changing owner role
    const { data: targetMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', id)
      .eq('user_id', userId)
      .single();

    if (targetMember?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
