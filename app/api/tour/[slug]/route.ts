export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Create service client for public access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!slug) {
      return NextResponse.json({ error: 'Missing tour slug' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the tour with scenes and hotspots
    const { data: tour, error } = await supabase
      .from('virtual_tours')
      .select(`
        id,
        name,
        description,
        slug,
        auto_rotate,
        show_compass,
        show_floor_plan,
        logo_url,
        brand_color,
        show_branding,
        cover_image_url,
        status,
        is_public,
        tour_type,
        tour_scenes (
          id,
          name,
          description,
          image_url,
          thumbnail_url,
          is_360,
          initial_yaw,
          initial_pitch,
          initial_zoom,
          sort_order,
          is_start_scene,
          floor_number,
          floor_name,
          tour_hotspots (
            id,
            yaw,
            pitch,
            hotspot_type,
            target_scene_id,
            title,
            content,
            image_url,
            video_url,
            link_url,
            icon,
            color,
            size
          )
        )
      `)
      .eq('slug', slug)
      // // .eq('is_public', true)
      // // .eq('status', 'published')
      .single();

    if (error || !tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Sort scenes by sort_order
    if (tour.tour_scenes) {
      tour.tour_scenes.sort((a: any, b: any) => a.sort_order - b.sort_order);
    }

    // Increment view count (fire and forget)
    try {
      await supabase.rpc('increment_tour_views', { tour_slug: slug });
    } catch (e) {
      // Ignore errors
    }

    return NextResponse.json(tour);

  } catch (error: any) {
    console.error('Tour API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
