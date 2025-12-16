export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processRenovation, calculateCredits, estimateCost } from '@/lib/renovation/service';

// POST - Process a renovation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      listingId, 
      photoId, 
      imageUrl, 
      roomType, 
      renovationType, 
      style, 
      options = {} 
    } = body;

    if (!imageUrl || !roomType || !renovationType || !style) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, roomType, renovationType, style' },
        { status: 400 }
      );
    }

    const creditsRequired = calculateCredits(renovationType);

    // Create renovation record
    const { data: renovation, error: createError } = await supabase
      .from('renovations')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        photo_id: photoId || null,
        original_url: imageUrl,
        room_type: roomType,
        renovation_type: renovationType,
        style: style,
        options: options,
        status: 'processing',
        credits_used: creditsRequired,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create renovation error:', createError);
      return NextResponse.json({ error: 'Failed to create renovation job' }, { status: 500 });
    }

    // Process the renovation
    const result = await processRenovation({
      imageUrl,
      roomType,
      renovationType,
      style,
      options,
    });

    // Update renovation record with result
    const updateData: any = {
      status: result.success ? 'completed' : 'failed',
      processing_time_ms: result.processingTime,
      model_used: result.model || null,
      prompt_used: result.prompt || null,
      api_cost: estimateCost(renovationType),
      completed_at: new Date().toISOString(),
    };

    if (result.success) {
      updateData.result_url = result.resultUrl;
      updateData.result_urls = result.resultUrls || [result.resultUrl];
    } else {
      updateData.error_message = result.error;
    }

    const { error: updateError } = await supabase
      .from('renovations')
      .update(updateData)
      .eq('id', renovation.id);

    if (updateError) {
      console.error('Update renovation error:', updateError);
    }

    // Log to api_costs table
    try {
      await supabase.from('api_costs').insert({
        user_id: user.id,
        provider: result.model || 'unknown',
        operation: `renovation-${renovationType}`,
        cost: estimateCost(renovationType),
        tokens_used: 0,
        model: result.model || 'unknown',
        metadata: {
          renovation_id: renovation.id,
          room_type: roomType,
          style: style,
          processing_time_ms: result.processingTime,
        },
      });
    } catch (costError) {
      console.error('Cost logging error:', costError);
    }

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          renovationId: renovation.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      renovationId: renovation.id,
      resultUrl: result.resultUrl,
      resultUrls: result.resultUrls,
      processingTime: result.processingTime,
      creditsUsed: creditsRequired,
    });

  } catch (error: any) {
    console.error('Renovation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's renovations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('renovations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data: renovations, error } = await query;

    if (error) {
      console.error('Fetch renovations error:', error);
      return NextResponse.json({ error: 'Failed to fetch renovations' }, { status: 500 });
    }

    return NextResponse.json(renovations || []);

  } catch (error: any) {
    console.error('Renovation GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a renovation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing renovation ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('renovations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete renovation error:', error);
      return NextResponse.json({ error: 'Failed to delete renovation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Renovation DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
