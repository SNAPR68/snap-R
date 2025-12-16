export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's virtual tours
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const slug = searchParams.get('slug');
    const includeScenes = searchParams.get('includeScenes') === 'true';

    // Fetch single tour by slug (for public viewing)
    if (slug) {
      const { data: tour, error } = await supabase
        .from('virtual_tours')
        .select(`
          *,
          tour_scenes (
            *,
            tour_hotspots (*)
          )
        `)
        .eq('slug', slug)
        .single();

      if (error || !tour) {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
      }

      // Check access
      if (tour.user_id !== user.id && (!tour.is_public || tour.status !== 'published')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json(tour);
    }

    // Fetch user's tours
    let query = supabase
      .from('virtual_tours')
      .select(includeScenes ? `*, tour_scenes (*)` : '*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data: tours, error } = await query;

    if (error) {
      console.error('Fetch tours error:', error);
      return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
    }

    return NextResponse.json(tours || []);

  } catch (error: any) {
    console.error('Virtual tours GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new virtual tour
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
      name,
      description,
      tourType = 'standard',
      settings = {},
      scenes = [],
    } = body;

    // Create the tour
    const { data: tour, error: tourError } = await supabase
      .from('virtual_tours')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        name: name || 'Virtual Tour',
        description,
        tour_type: tourType,
        auto_rotate: settings.autoRotate ?? true,
        show_compass: settings.showCompass ?? true,
        show_floor_plan: settings.showFloorPlan ?? false,
        logo_url: settings.logoUrl,
        brand_color: settings.brandColor || '#D4AF37',
        show_branding: settings.showBranding ?? true,
        status: 'draft',
        is_public: false,
        credits_used: tourType === 'premium' ? 10 : 5,
      })
      .select()
      .single();

    if (tourError) {
      console.error('Create tour error:', tourError);
      return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
    }

    // Create scenes if provided
    if (scenes.length > 0) {
      const scenesData = scenes.map((scene: any, index: number) => ({
        tour_id: tour.id,
        name: scene.name || `Scene ${index + 1}`,
        description: scene.description,
        image_url: scene.imageUrl,
        thumbnail_url: scene.thumbnailUrl,
        is_360: scene.is360 ?? true,
        initial_yaw: scene.initialYaw || 0,
        initial_pitch: scene.initialPitch || 0,
        initial_zoom: scene.initialZoom || 100,
        sort_order: index,
        is_start_scene: index === 0,
        floor_number: scene.floorNumber || 1,
        floor_name: scene.floorName || 'Main Floor',
      }));

      const { error: scenesError } = await supabase
        .from('tour_scenes')
        .insert(scenesData);

      if (scenesError) {
        console.error('Create scenes error:', scenesError);
        // Don't fail the whole request, tour is created
      }
    }

    // Fetch the complete tour with scenes
    const { data: completeTour } = await supabase
      .from('virtual_tours')
      .select(`*, tour_scenes (*)`)
      .eq('id', tour.id)
      .single();

    return NextResponse.json({
      success: true,
      tour: completeTour || tour,
    });

  } catch (error: any) {
    console.error('Virtual tours POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a virtual tour
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing tour ID' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('virtual_tours')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Map camelCase to snake_case
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.autoRotate !== undefined) updateData.auto_rotate = updates.autoRotate;
    if (updates.showCompass !== undefined) updateData.show_compass = updates.showCompass;
    if (updates.showFloorPlan !== undefined) updateData.show_floor_plan = updates.showFloorPlan;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    if (updates.brandColor !== undefined) updateData.brand_color = updates.brandColor;
    if (updates.coverImageUrl !== undefined) updateData.cover_image_url = updates.coverImageUrl;

    // Set published_at when publishing
    if (updates.status === 'published' && updates.isPublic) {
      updateData.published_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data: tour, error } = await supabase
      .from('virtual_tours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update tour error:', error);
      return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tour });

  } catch (error: any) {
    console.error('Virtual tours PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a virtual tour
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
      return NextResponse.json({ error: 'Missing tour ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('virtual_tours')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete tour error:', error);
      return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Virtual tours DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
