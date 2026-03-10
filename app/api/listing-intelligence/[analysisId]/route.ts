import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { logger } from '@/lib/logger';
import { listingIntelligencePatchSchema, parseBody } from '@/lib/validation/schemas';

interface PhotoScore {
  id: string;
  photo_index: number;
  photo_url: string | null;
  overall_score: number | null;
  lighting_score: number | null;
  composition_score: number | null;
  clarity_score: number | null;
  appeal_score: number | null;
  room_type: string | null;
  is_exterior: boolean | null;
  is_hero_candidate: boolean | null;
  hero_potential: number | null;
  recommendations: unknown;
  enhancement_potential: number | null;
  ai_feedback: string | null;
}

interface Recommendation {
  id: string;
  photo_index: number | null;
  photo_url: string | null;
  tool_id: string | null;
  tool_name: string | null;
  priority: number | null;
  impact_estimate: number | null;
  impact_description: string | null;
  reason: string | null;
  applied: boolean | null;
  applied_at: string | null;
  result_url: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const supabase = await createClient();

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
      photoScores: (photoScores as PhotoScore[] | null)?.map(ps => ({
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
      recommendations: (recommendations as Recommendation[] | null)?.map(rec => ({
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[Listing Intelligence] Get Error:', error);
    return NextResponse.json({ error: message || 'Failed to get analysis' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = parseBody(listingIntelligencePatchSchema, body);
    if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }
    const { recommendationId, resultUrl } = validated.data;

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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message || 'Failed to update' }, { status: 500 });
  }
}
