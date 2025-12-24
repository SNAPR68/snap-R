export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Missing tour slug' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Tour API] Missing env vars:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First get the tour
    const { data: tour, error: tourError } = await supabase
      .from('virtual_tours')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tourError || !tour) {
      console.error('[Tour API] Tour error:', tourError);
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Get scenes separately
    const { data: scenes, error: scenesError } = await supabase
      .from('tour_scenes')
      .select('*')
      .eq('tour_id', tour.id)
      .order('sort_order', { ascending: true });

    if (scenesError) {
      console.error('[Tour API] Scenes error:', scenesError);
    }

    // Get hotspots for each scene
    const scenesWithHotspots = await Promise.all(
      (scenes || []).map(async (scene: any) => {
        const { data: hotspots } = await supabase
          .from('tour_hotspots')
          .select('*')
          .eq('scene_id', scene.id);
        return { ...scene, tour_hotspots: hotspots || [] };
      })
    );

    // Increment view count (fire and forget)
    supabase.rpc('increment_tour_views', { tour_slug: slug }).catch(() => {});

    return NextResponse.json({
      ...tour,
      tour_scenes: scenesWithHotspots
    });

  } catch (error: any) {
    console.error('[Tour API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
