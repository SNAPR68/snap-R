import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = params;

    const { data: analysis, error: analysisError } = await supabase
      .from('listing_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const { data: photoScores } = await supabase
      .from('photo_scores')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('photo_index', { ascending: true });

    const { data: recommendations } = await supabase
      .from('enhancement_recommendations')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('impact_estimate', { ascending: false });

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        overallScore: analysis.overall_score,
        heroImageIndex: analysis.hero_image_index,
        heroImageUrl: analysis.hero_image_url,
        totalPhotos: analysis.total_photos,
        analysisSummary: analysis.analysis_summary,
        competitiveBenchmark: analysis.competitive_benchmark,
        estimatedDomCurrent: analysis.estimated_dom_current,
        estimatedDomOptimized: analysis.estimated_dom_optimized,
        status: analysis.status,
        createdAt: analysis.created_at,
      },
      photoScores: photoScores?.map(ps => ({
        id: ps.id,
        photoIndex: ps.photo_index,
        photoUrl: ps.photo_url,
        overallScore: ps.overall_score,
        lightingScore: ps.lighting_score,
        compositionScore: ps.composition_score,
        clarityScore: ps.clarity_score,
        appealScore: ps.appeal_score,
        roomType: ps.room_type,
        isExterior: ps.is_exterior,
        isHeroCandidate: ps.is_hero_candidate,
        heroPotential: ps.hero_potential,
        recommendations: ps.recommendations,
        enhancementPotential: ps.enhancement_potential,
        aiFeedback: ps.ai_feedback,
      })) || [],
      recommendations: recommendations?.map(rec => ({
        id: rec.id,
        photoIndex: rec.photo_index,
        photoUrl: rec.photo_url,
        toolId: rec.tool_id,
        toolName: rec.tool_name,
        priority: rec.priority,
        impactEstimate: rec.impact_estimate,
        impactDescription: rec.impact_description,
        reason: rec.reason,
        applied: rec.applied,
        appliedAt: rec.applied_at,
        resultUrl: rec.result_url,
      })) || [],
    });

  } catch (error: any) {
    console.error('[Listing Intelligence] Get Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get analysis' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { recommendationId, resultUrl } = body;

    if (!recommendationId) {
      return NextResponse.json({ error: 'recommendationId is required' }, { status: 400 });
    }

    const { data: analysis } = await supabase
      .from('listing_analyses')
      .select('id')
      .eq('id', params.analysisId)
      .eq('user_id', user.id)
      .single();

    if (!analysis) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });

    await supabase
      .from('enhancement_recommendations')
      .update({
        applied: true,
        applied_at: new Date().toISOString(),
        result_url: resultUrl || null,
      })
      .eq('id', recommendationId)
      .eq('analysis_id', params.analysisId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
