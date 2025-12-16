export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch portfolio(s)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    // Public portfolio by slug (no auth needed)
    if (slug) {
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          portfolio_items (*)
        `)
        .eq('slug', slug)
        .eq('is_public', true)
        .single();

      if (error || !portfolio) {
        return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
      }

      // Increment view count (non-blocking)
      supabase
        .from('portfolios')
        .update({ view_count: (portfolio.view_count || 0) + 1 })
        .eq('id', portfolio.id)
        .then(() => {});

      return NextResponse.json(portfolio);
    }

    // Auth required for own portfolios
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single portfolio by ID
    if (id) {
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          portfolio_items (*),
          portfolio_inquiries (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !portfolio) {
        return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
      }

      return NextResponse.json(portfolio);
    }

    // List user's portfolios
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_items (id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
    }

    return NextResponse.json(portfolios || []);

  } catch (error: any) {
    console.error('[Portfolio] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create portfolio
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, tagline, description, theme, accent_color } = body;

    // Generate unique slug
    let baseSlug = title 
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      : 'my-portfolio';
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs
    while (true) {
      const { data: existing } = await supabase
        .from('portfolios')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        slug,
        title: title || 'My Portfolio',
        tagline,
        description,
        theme: theme || 'dark',
        accent_color: accent_color || '#D4A017',
      })
      .select()
      .single();

    if (error) {
      console.error('[Portfolio] Create error:', error);
      return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      portfolio,
    });

  } catch (error: any) {
    console.error('[Portfolio] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update portfolio
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    // Remove protected fields
    delete updates.user_id;
    delete updates.created_at;
    delete updates.view_count;

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Portfolio] Update error:', error);
      return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      portfolio,
    });

  } catch (error: any) {
    console.error('[Portfolio] PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete portfolio
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Portfolio] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Portfolio] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
