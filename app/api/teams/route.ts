import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - List user's teams
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teams where user is a member
    const { data: memberTeams } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id);

    const teamIds = memberTeams?.map(m => m.team_id) || [];

    // Get team details
    let teams: Array<{
      id: string;
      name: string;
      slug: string;
      logo_url: string | null;
      plan: string;
      credits: number;
      owner_id: string;
      created_at: string;
      role: string;
    }> = [];

    if (teamIds.length > 0) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name, slug, logo_url, plan, credits, owner_id, created_at')
        .in('id', teamIds);

      if (teamData) {
        teams = teamData.map(team => {
          const member = memberTeams?.find(m => m.team_id === team.id);
          return { ...team, role: member?.role || 'viewer' };
        });
      }
    }

    // Also get teams user owns but might not be in team_members (edge case)
    const { data: ownedTeams } = await supabase
      .from('teams')
      .select('id, name, slug, logo_url, plan, credits, owner_id, created_at')
      .eq('owner_id', user.id);

    ownedTeams?.forEach(team => {
      if (!teams.find(t => t.id === team.id)) {
        teams.push({ ...team, role: 'owner' });
      }
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new team
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Team name must be at least 2 characters' }, { status: 400 });
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        slug,
        owner_id: user.id,
        plan: 'team',
        credits: 500
      })
      .select()
      .single();

    if (teamError) {
      console.error('Create team error:', teamError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Add owner as team member
    await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
        invited_by: user.id
      });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
