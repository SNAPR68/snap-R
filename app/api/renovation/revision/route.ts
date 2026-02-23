// Human Revision Request API
// Allows users to request FREE human revision of AI renovation results

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { adminSupabase } from '@/lib/supabase/admin';

// Notify editors via email when a new revision is requested
async function notifyEditorsOfRevision(revisionId: string, userId: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR <notifications@snap-r.com>',
      to: 'support@snap-r.com',
      subject: `🔄 New Revision Request #${revisionId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #D4A017, #B8860B); text-align: center; line-height: 48px; font-weight: bold; color: #000; font-size: 24px;">S</div>
          </div>
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">New Revision Request</h1>
          <p style="color: #4a4a4a; font-size: 16px;">A user has requested a human revision of their AI renovation result.</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Revision ID:</strong> ${revisionId}</p>
            <p style="margin: 8px 0 0;"><strong>User ID:</strong> ${userId}</p>
          </div>
          <a href="https://snap-r.com/admin/revisions" style="display: inline-block; background: linear-gradient(135deg, #D4A017, #B8860B); color: #000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">Review in Admin</a>
        </div>
      `,
    });
  } catch (emailError: unknown) {
    // Don't fail the request if email fails
    console.error('Failed to notify editors:', emailError);
  }
}

// Notify user via email when their revision is completed
async function notifyUserOfCompletion(revisionId: string, userId: string) {
  try {
    const admin = adminSupabase();
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!profile?.email) return;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR <notifications@snap-r.com>',
      to: profile.email,
      subject: '✅ Your Revision is Ready!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #D4A017, #B8860B); text-align: center; line-height: 48px; font-weight: bold; color: #000; font-size: 24px;">S</div>
          </div>
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Your Revision is Complete!</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hi ${profile.full_name || 'there'}, your requested renovation revision has been completed by our editing team.
          </p>
          <a href="https://snap-r.com/dashboard/renovation" style="display: block; text-align: center; background: linear-gradient(135deg, #D4A017, #B8860B); color: #000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">View Your Revision</a>
          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 30px;">
            If you have any questions, reply to this email or contact support.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} SnapR. All rights reserved.
          </p>
        </div>
      `,
    });
  } catch (emailError: unknown) {
    console.error('Failed to notify user of revision completion:', emailError);
  }
}

interface RevisionUpdateData {
  updated_at: string;
  status?: string;
  human_result_url?: string;
  editor_notes?: string;
  assigned_editor_id?: string;
  started_at?: string;
  completed_at?: string;
}

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

    // Send notification email to editors
    await notifyEditorsOfRevision(revision.id, user.id);

    return NextResponse.json({
      success: true,
      revisionId: revision.id,
      message: 'Revision request submitted. Our team will review within 24-48 hours.',
      estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Revision API error:', error);
    return NextResponse.json(
      { error: message },
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Revision GET error:', error);
    return NextResponse.json(
      { error: message },
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

    const updateData: RevisionUpdateData = {
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

    // If completed, notify the user via email
    if (status === 'completed' && revision?.user_id) {
      await notifyUserOfCompletion(revisionId, revision.user_id);
    }

    return NextResponse.json({
      success: true,
      revision,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Revision PATCH error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
