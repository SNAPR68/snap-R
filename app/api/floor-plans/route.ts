export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateFloorPlan } from '@/lib/floorplans/service';
import { calculateCredits, calculatePrice, getEstimatedDelivery, PLAN_TYPES } from '@/lib/floorplans/config';

// POST - Generate or order a floor plan
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
      planType = '2d-basic',
      style = 'modern',
      colorScheme = 'color',
      sourcePhotos = [],
      propertyDetails = {},
      options = {},
      isManualOrder = false,
      rushOrder = false,
      specialInstructions = '',
    } = body;

    // Validate plan type
    if (!PLAN_TYPES[planType as keyof typeof PLAN_TYPES]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const credits = calculateCredits(planType);
    const price = calculatePrice(planType, { rush: rushOrder });

    // Create floor plan record
    const { data: floorPlan, error: createError } = await supabase
      .from('floor_plans')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        name: propertyDetails.address ? `${propertyDetails.address} Floor Plan` : 'Floor Plan',
        plan_type: planType,
        total_sqft: propertyDetails.sqft || null,
        bedrooms: propertyDetails.bedrooms || null,
        bathrooms: propertyDetails.bathrooms || null,
        floors: propertyDetails.floors || 1,
        source_photos: sourcePhotos,
        style: style,
        color_scheme: colorScheme,
        show_dimensions: options.showDimensions ?? true,
        show_furniture: options.showFurniture ?? false,
        show_room_names: options.showRoomNames ?? true,
        show_sqft: options.showSqft ?? true,
        include_branding: options.includeBranding ?? false,
        brand_logo_url: options.brandLogoUrl || null,
        status: 'processing',
        credits_used: credits,
        price_paid: price,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create floor plan error:', createError);
      return NextResponse.json({ error: 'Failed to create floor plan' }, { status: 500 });
    }

    // If manual order, create order record and return
    if (isManualOrder || sourcePhotos.length === 0) {
      const estimatedDelivery = getEstimatedDelivery(planType, rushOrder);
      
      const { data: order, error: orderError } = await supabase
        .from('floor_plan_orders')
        .insert({
          user_id: user.id,
          floor_plan_id: floorPlan.id,
          listing_id: listingId || null,
          plan_type: planType,
          rush_order: rushOrder,
          special_instructions: specialInstructions,
          base_price: PLAN_TYPES[planType as keyof typeof PLAN_TYPES].price,
          rush_fee: rushOrder ? Math.round(PLAN_TYPES[planType as keyof typeof PLAN_TYPES].price * 0.5) : 0,
          total_price: price,
          status: 'pending',
          estimated_delivery: estimatedDelivery.toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        console.error('Create order error:', orderError);
      }

      // Update floor plan status
      await supabase
        .from('floor_plans')
        .update({ 
          status: 'pending',
          processing_method: 'manual',
        })
        .eq('id', floorPlan.id);

      return NextResponse.json({
        success: true,
        floorPlanId: floorPlan.id,
        orderId: order?.id,
        status: 'pending',
        message: 'Order placed! Your floor plan will be ready soon.',
        estimatedDelivery,
        price,
      });
    }

    // Try AI generation
    const result = await generateFloorPlan({
      listingId,
      planType,
      style,
      colorScheme,
      sourcePhotos,
      propertyDetails,
      options: {
        showDimensions: options.showDimensions ?? true,
        showFurniture: options.showFurniture ?? false,
        showRoomNames: options.showRoomNames ?? true,
        showSqft: options.showSqft ?? true,
        includeBranding: options.includeBranding ?? false,
        brandLogoUrl: options.brandLogoUrl,
      },
    });

    // Update floor plan with result
    const updateData: any = {
      status: result.success ? 'completed' : 'pending',
      processing_method: result.processingMethod,
      completed_at: result.success ? new Date().toISOString() : null,
    };

    if (result.success && result.imageUrl) {
      updateData.image_url = result.imageUrl;
      if (result.rooms) {
        updateData.rooms = result.rooms;
      }
    } else {
      updateData.error_message = result.error;
    }

    await supabase
      .from('floor_plans')
      .update(updateData)
      .eq('id', floorPlan.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        floorPlanId: floorPlan.id,
        imageUrl: result.imageUrl,
        rooms: result.rooms,
        processingMethod: result.processingMethod,
      });
    } else {
      // Create manual order as fallback
      const estimatedDelivery = getEstimatedDelivery(planType, rushOrder);
      
      await supabase
        .from('floor_plan_orders')
        .insert({
          user_id: user.id,
          floor_plan_id: floorPlan.id,
          listing_id: listingId || null,
          plan_type: planType,
          rush_order: rushOrder,
          special_instructions: specialInstructions,
          base_price: PLAN_TYPES[planType as keyof typeof PLAN_TYPES].price,
          rush_fee: 0,
          total_price: price,
          status: 'pending',
          estimated_delivery: estimatedDelivery.toISOString(),
        });

      return NextResponse.json({
        success: true,
        floorPlanId: floorPlan.id,
        status: 'pending',
        message: 'AI generation unavailable. Order placed for manual processing.',
        estimatedDelivery,
        price,
      });
    }

  } catch (error: any) {
    console.error('Floor plan API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's floor plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const status = searchParams.get('status');

    let query = supabase
      .from('floor_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: floorPlans, error } = await query;

    if (error) {
      console.error('Fetch floor plans error:', error);
      return NextResponse.json({ error: 'Failed to fetch floor plans' }, { status: 500 });
    }

    return NextResponse.json(floorPlans || []);

  } catch (error: any) {
    console.error('Floor plan GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a floor plan
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
      return NextResponse.json({ error: 'Missing floor plan ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('floor_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete floor plan error:', error);
      return NextResponse.json({ error: 'Failed to delete floor plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Floor plan DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
