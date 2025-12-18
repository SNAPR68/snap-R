export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const byOwner = searchParams.get('byOwner');

    // Public lookup by slug (for branded login pages)
    if (slug) {
      const { data: org } = await serviceSupabase
        .from('organizations')
        .select('name, slug, logo_url, primary_color, secondary_color, accent_color, platform_name, custom_login_message, white_label_active')
        .eq('slug', slug)
        .eq('white_label_active', true)
        .single();

      return NextResponse.json({ org: org || null });
    }

    // Authenticated lookup by owner
    if (byOwner) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: org } = await serviceSupabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      return NextResponse.json({ org: org || null });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Organization GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, platform_name, logo_url, primary_color, secondary_color, accent_color } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug can only contain lowercase letters, numbers, and hyphens' }, { status: 400 });
    }

    // Check if user already has an org
    const { data: existingOrg } = await serviceSupabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (existingOrg) {
      return NextResponse.json({ error: 'You already have an organization' }, { status: 400 });
    }

    // Create organization
    const { data: newOrg, error: insertError } = await serviceSupabase
      .from('organizations')
      .insert({
        name,
        slug,
        platform_name: platform_name || name,
        logo_url: logo_url || null,
        primary_color: primary_color || '#D4A017',
        secondary_color: secondary_color || '#1A1A1A',
        accent_color: accent_color || '#B8860B',
        owner_id: user.id,
        white_label_active: false,
        subscription_status: 'inactive',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
        return NextResponse.json({ error: 'This slug is already taken' }, { status: 400 });
      }
      throw insertError;
    }

    return NextResponse.json({ org: newOrg });
  } catch (error: any) {
    console.error('Organization POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update organization
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify ownership
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!org || org.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Don't allow slug change if white-label is active
    if (updates.slug) {
      const { data: currentOrg } = await serviceSupabase
        .from('organizations')
        .select('white_label_active, slug')
        .eq('id', id)
        .single();

      if (currentOrg?.white_label_active && currentOrg.slug !== updates.slug) {
        return NextResponse.json({ error: 'Cannot change slug while white-label is active' }, { status: 400 });
      }
    }

    const { data: updatedOrg, error: updateError } = await serviceSupabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'This slug is already taken' }, { status: 400 });
      }
      throw updateError;
    }

    return NextResponse.json({ org: updatedOrg });
  } catch (error: any) {
    console.error('Organization PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
