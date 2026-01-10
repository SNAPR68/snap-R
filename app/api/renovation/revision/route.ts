// Human Revision Request API
// Allows users to request FREE human revision of AI renovation results

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Create a revision request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      renovationId,
      originalImageUrl,
      aiResultUrl,
      notes,
      selectedRenovations,
      style,
      detailedOptions,
    } = body;

    if (!renovationId || !originalImageUrl || !aiResultUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create revision request
    const { data: revision, error } = await supabase
      .from('renovation_revisions')
      .insert({
        user_id: user.id,
        renovation_id: renovationId,
        original_image_url: originalImageUrl,
        ai_result_url: aiResultUrl,
        customer_notes: notes || '',
        renovation_details: {
          selectedRenovations,
          style,
          detailedOptions,
        },
        status: 'pending',
        priority: 'normal',
      })
      .select()
      .single();

    if (error) {
      console.error('Create revision error:', error);
      return NextResponse.json(
        { error: 'Failed to create revision request' },
        { status: 500 }
      );
    }

    // Send notification (email/slack) to editors
    // TODO: Implement notification system
    console.log(`[Revision] New request #${revision.id} from user ${user.id}`);

    return NextResponse.json({
      success: true,
      revisionId: revision.id,
      message: 'Revision request submitted. Our team will review within 24-48 hours.',
      estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error: any) {
    console.error('Revision API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's revision requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('renovation_revisions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: revisions, error } = await query;

    if (error) {
      console.error('Fetch revisions error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch revisions' },
        { status: 500 }
      );
    }

    return NextResponse.json(revisions || []);

  } catch (error: any) {
    console.error('Revision GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update revision (for editors)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an editor/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Not authorized to update revisions' }, { status: 403 });
    }

    const body = await request.json();
    const { revisionId, status, humanResultUrl, editorNotes } = body;

    if (!revisionId) {
      return NextResponse.json({ error: 'Missing revision ID' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (humanResultUrl) updateData.human_result_url = humanResultUrl;
    if (editorNotes) updateData.editor_notes = editorNotes;

    if (status === 'in_progress') {
      updateData.assigned_editor_id = user.id;
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: revision, error } = await supabase
      .from('renovation_revisions')
      .update(updateData)
      .eq('id', revisionId)
      .select()
      .single();

    if (error) {
      console.error('Update revision error:', error);
      return NextResponse.json(
        { error: 'Failed to update revision' },
        { status: 500 }
      );
    }

    // If completed, notify the user
    if (status === 'completed') {
      console.log(`[Revision] #${revisionId} completed - notify user`);
      // TODO: Send email notification to user
    }

    return NextResponse.json({
      success: true,
      revision,
    });

  } catch (error: any) {
    console.error('Revision PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
