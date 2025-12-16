export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to verify tour ownership
async function verifyTourOwnership(supabase: any, tourId: string, userId: string) {
  const { data } = await supabase
    .from('virtual_tours')
    .select('user_id')
    .eq('id', tourId)
    .single();
  
  return data?.user_id === userId;
}

// GET - Fetch scenes for a tour
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');

    if (!tourId) {
      return NextResponse.json({ error: 'Missing tourId' }, { status: 400 });
    }

    const { data: scenes, error } = await supabase
      .from('tour_scenes')
      .select(`*, tour_hotspots (*)`)
      .eq('tour_id', tourId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Fetch scenes error:', error);
      return NextResponse.json({ error: 'Failed to fetch scenes' }, { status: 500 });
    }

    return NextResponse.json(scenes || []);

  } catch (error: any) {
    console.error('Scenes GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new scene
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tourId,
      name,
      description,
      imageUrl,
      thumbnailUrl,
      is360 = true,
      initialYaw = 0,
      initialPitch = 0,
      initialZoom = 100,
      sortOrder,
      isStartScene = false,
      floorNumber = 1,
      floorName = 'Main Floor',
    } = body;

    if (!tourId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: tourId, imageUrl' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (!(await verifyTourOwnership(supabase, tourId, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get max sort order if not provided
    let order = sortOrder;
    if (order === undefined) {
      const { data: maxOrder } = await supabase
        .from('tour_scenes')
        .select('sort_order')
        .eq('tour_id', tourId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      
      order = (maxOrder?.sort_order ?? -1) + 1;
    }

    // If this is start scene, unset others
    if (isStartScene) {
      await supabase
        .from('tour_scenes')
        .update({ is_start_scene: false })
        .eq('tour_id', tourId);
    }

    const { data: scene, error } = await supabase
      .from('tour_scenes')
      .insert({
        tour_id: tourId,
        name: name || `Scene ${order + 1}`,
        description,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        is_360: is360,
        initial_yaw: initialYaw,
        initial_pitch: initialPitch,
        initial_zoom: initialZoom,
        sort_order: order,
        is_start_scene: isStartScene || order === 0,
        floor_number: floorNumber,
        floor_name: floorName,
      })
      .select()
      .single();

    if (error) {
      console.error('Create scene error:', error);
      return NextResponse.json({ error: 'Failed to create scene' }, { status: 500 });
    }

    return NextResponse.json({ success: true, scene });

  } catch (error: any) {
    console.error('Scenes POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a scene
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, tourId, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing scene ID' }, { status: 400 });
    }

    // Get the scene to verify ownership
    const { data: scene } = await supabase
      .from('tour_scenes')
      .select('tour_id')
      .eq('id', id)
      .single();

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    if (!(await verifyTourOwnership(supabase, scene.tour_id, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Map camelCase to snake_case
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.thumbnailUrl !== undefined) updateData.thumbnail_url = updates.thumbnailUrl;
    if (updates.is360 !== undefined) updateData.is_360 = updates.is360;
    if (updates.initialYaw !== undefined) updateData.initial_yaw = updates.initialYaw;
    if (updates.initialPitch !== undefined) updateData.initial_pitch = updates.initialPitch;
    if (updates.initialZoom !== undefined) updateData.initial_zoom = updates.initialZoom;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.floorNumber !== undefined) updateData.floor_number = updates.floorNumber;
    if (updates.floorName !== undefined) updateData.floor_name = updates.floorName;

    // Handle start scene
    if (updates.isStartScene === true) {
      await supabase
        .from('tour_scenes')
        .update({ is_start_scene: false })
        .eq('tour_id', scene.tour_id);
      updateData.is_start_scene = true;
    }

    const { data: updated, error } = await supabase
      .from('tour_scenes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update scene error:', error);
      return NextResponse.json({ error: 'Failed to update scene' }, { status: 500 });
    }

    return NextResponse.json({ success: true, scene: updated });

  } catch (error: any) {
    console.error('Scenes PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scene
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
      return NextResponse.json({ error: 'Missing scene ID' }, { status: 400 });
    }

    // Get the scene to verify ownership
    const { data: scene } = await supabase
      .from('tour_scenes')
      .select('tour_id')
      .eq('id', id)
      .single();

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    if (!(await verifyTourOwnership(supabase, scene.tour_id, user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('tour_scenes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete scene error:', error);
      return NextResponse.json({ error: 'Failed to delete scene' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Scenes DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
