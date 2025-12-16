export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch portfolio items
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const itemId = searchParams.get('id');
    const featured = searchParams.get('featured');

    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    // Single item
    if (itemId) {
      const { data: item, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('id', itemId)
        .eq('portfolio_id', portfolioId)
        .single();

      if (error || !item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      return NextResponse.json(item);
    }

    // List items
    let query = supabase
      .from('portfolio_items')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('display_order', { ascending: true });

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: items, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json(items || []);

  } catch (error: any) {
    console.error('[Portfolio Items] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add portfolio item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      portfolioId,
      beforeUrl,
      afterUrl,
      title,
      description,
      enhancementType,
      roomType,
      clientName,
      clientTestimonial,
      tags,
      isFeatured
    } = body;

    if (!portfolioId || !beforeUrl || !afterUrl) {
      return NextResponse.json({ 
        error: 'portfolioId, beforeUrl, and afterUrl are required' 
      }, { status: 400 });
    }

    // Verify portfolio ownership
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Get next display order
    const { data: lastItem } = await supabase
      .from('portfolio_items')
      .select('display_order')
      .eq('portfolio_id', portfolioId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = (lastItem?.display_order || 0) + 1;

    const { data: item, error } = await supabase
      .from('portfolio_items')
      .insert({
        portfolio_id: portfolioId,
        before_url: beforeUrl,
        after_url: afterUrl,
        title,
        description,
        enhancement_type: enhancementType,
        room_type: roomType,
        client_name: clientName,
        client_testimonial: clientTestimonial,
        tags: tags || [],
        is_featured: isFeatured || false,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('[Portfolio Items] Create error:', error);
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item,
    });

  } catch (error: any) {
    console.error('[Portfolio Items] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update portfolio item
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, portfolioId, ...updates } = body;

    if (!id || !portfolioId) {
      return NextResponse.json({ error: 'Item ID and Portfolio ID required' }, { status: 400 });
    }

    // Verify portfolio ownership
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Transform camelCase to snake_case
    const dbUpdates: any = {};
    if (updates.beforeUrl !== undefined) dbUpdates.before_url = updates.beforeUrl;
    if (updates.afterUrl !== undefined) dbUpdates.after_url = updates.afterUrl;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.enhancementType !== undefined) dbUpdates.enhancement_type = updates.enhancementType;
    if (updates.roomType !== undefined) dbUpdates.room_type = updates.roomType;
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.clientTestimonial !== undefined) dbUpdates.client_testimonial = updates.clientTestimonial;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;

    const { data: item, error } = await supabase
      .from('portfolio_items')
      .update(dbUpdates)
      .eq('id', id)
      .eq('portfolio_id', portfolioId)
      .select()
      .single();

    if (error) {
      console.error('[Portfolio Items] Update error:', error);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item,
    });

  } catch (error: any) {
    console.error('[Portfolio Items] PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove portfolio item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const portfolioId = searchParams.get('portfolioId');

    if (!id || !portfolioId) {
      return NextResponse.json({ error: 'Item ID and Portfolio ID required' }, { status: 400 });
    }

    // Verify portfolio ownership
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', id)
      .eq('portfolio_id', portfolioId);

    if (error) {
      console.error('[Portfolio Items] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Portfolio Items] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk add items from recent enhancements
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { portfolioId, items } = body;

    if (!portfolioId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'portfolioId and items array required' 
      }, { status: 400 });
    }

    // Verify portfolio ownership
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Get current max order
    const { data: lastItem } = await supabase
      .from('portfolio_items')
      .select('display_order')
      .eq('portfolio_id', portfolioId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    let orderCounter = (lastItem?.display_order || 0) + 1;

    // Prepare bulk insert
    const inserts = items.map((item: any) => ({
      portfolio_id: portfolioId,
      before_url: item.beforeUrl,
      after_url: item.afterUrl,
      title: item.title,
      description: item.description,
      enhancement_type: item.enhancementType,
      room_type: item.roomType,
      tags: item.tags || [],
      display_order: orderCounter++,
    }));

    const { data: insertedItems, error } = await supabase
      .from('portfolio_items')
      .insert(inserts)
      .select();

    if (error) {
      console.error('[Portfolio Items] Bulk insert error:', error);
      return NextResponse.json({ error: 'Failed to add items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      addedCount: insertedItems?.length || 0,
      items: insertedItems,
    });

  } catch (error: any) {
    console.error('[Portfolio Items] PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
