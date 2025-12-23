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

    const decodedSlug = decodeURIComponent(slug);
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: tour, error: tourError } = await supabase
      .from('virtual_tours')
      .select('*')
      .eq('slug', decodedSlug)
      .single();

    if (tourError || !tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const { data: scenes } = await supabase
      .from('tour_scenes')
      .select('*')
      .eq('tour_id', tour.id)
      .order('sort_order', { ascending: true });

    const sceneIds = (scenes || []).map((s: any) => s.id);
    let hotspots: any[] = [];
    
    if (sceneIds.length > 0) {
      const { data: hotspotsData } = await supabase
        .from('tour_hotspots')
        .select('*')
        .in('scene_id', sceneIds);
      hotspots = hotspotsData || [];
    }

    const scenesWithHotspots = (scenes || []).map((scene: any) => ({
      ...scene,
      tour_hotspots: hotspots.filter((h: any) => h.scene_id === scene.id)
    }));

    try { supabase.rpc('increment_tour_views', { tour_slug: decodedSlug }); } catch (e) {}

    return NextResponse.json({
      ...tour,
      tour_scenes: scenesWithHotspots
    });

  } catch (error: any) {
    console.error('Tour API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
