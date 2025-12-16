import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Get team details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get member count
    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', id);

    return NextResponse.json({ team: { ...team, member_count: count } });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Update team
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();
    
    // Only allow updating certain fields
    const allowedFields = ['name', 'logo_url', 'settings'];
    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = updates[key];
      }
    }
    safeUpdates.updated_at = new Date().toISOString();

    const { data: team, error } = await supabase
      .from('teams')
      .update(safeUpdates)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete team
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
