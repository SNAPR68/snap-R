import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { analyzeListingPhotos, calculateAnalysisCost } from '@/lib/listing-intelligence/analyzer';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { photoUrls, listingId } = body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: 'photoUrls array is required' }, { status: 400 });
    }

    if (photoUrls.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 photos per analysis' }, { status: 400 });
    }

    const { data: analysis, error: createError } = await supabase
      .from('listing_analyses')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        total_photos: photoUrls.length,
        status: 'analyzing',
      })
      .select()
      .single();

    if (createError) {
      console.error('[Listing Intelligence] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create analysis record' }, { status: 500 });
    }

    try {
      const result = await analyzeListingPhotos(photoUrls);

      const photoScoreInserts = result.photoScores.map(score => ({
        analysis_id: analysis.id,
        photo_index: score.photoIndex,
        photo_url: score.photoUrl,
        overall_score: score.overallScore,
        lighting_score: score.lightingScore,
        composition_score: score.compositionScore,
        clarity_score: score.clarityScore,
        appeal_score: score.appealScore,
        room_type: score.roomType,
        is_exterior: score.isExterior,
        is_hero_candidate: score.isHeroCandidate,
        hero_potential: score.heroPotential,
        recommendations: score.recommendations,
        enhancement_potential: score.enhancementPotential,
        ai_feedback: score.aiFeedback,
      }));

      const { data: photoScores, error: scoresError } = await supabase
        .from('photo_scores')
        .insert(photoScoreInserts)
        .select();

      if (scoresError) console.error('[Listing Intelligence] Scores error:', scoresError);

      const recommendationInserts: any[] = [];
      result.photoScores.forEach(photo => {
        photo.recommendations.forEach(rec => {
          recommendationInserts.push({
            analysis_id: analysis.id,
            photo_score_id: photoScores?.find(ps => ps.photo_index === photo.photoIndex)?.id,
            photo_index: photo.photoIndex,
            photo_url: photo.photoUrl,
            tool_id: rec.toolId,
            tool_name: rec.toolName,
            priority: rec.priority,
            impact_estimate: rec.impactEstimate,
            impact_description: rec.impactDescription,
            reason: rec.reason,
            applied: false,
          });
        });
      });

      if (recommendationInserts.length > 0) {
        const { error: recError } = await supabase
          .from('enhancement_recommendations')
          .insert(recommendationInserts);
        if (recError) console.error('[Listing Intelligence] Recommendations error:', recError);
      }

      await supabase
        .from('listing_analyses')
        .update({
          overall_score: result.overallScore,
          hero_image_index: result.heroImageIndex,
          hero_image_url: result.heroImageUrl,
          analysis_summary: result.analysisSummary,
          competitive_benchmark: result.competitiveBenchmark,
          estimated_dom_current: result.estimatedDomCurrent,
          estimated_dom_optimized: result.estimatedDomOptimized,
          status: 'completed',
        })
        .eq('id', analysis.id);

      const cost = calculateAnalysisCost(photoUrls.length);
      // Track cost (non-blocking)
      try {
        await supabase.from('api_costs').insert({
          user_id: user.id,
          provider: 'openai',
          tool: 'listing-intelligence',
          model: 'gpt-4o-vision',
          input_tokens: photoUrls.length * 1000,
          output_tokens: photoUrls.length * 500,
          cost: cost,
          metadata: { analysis_id: analysis.id, photo_count: photoUrls.length },
        });
      } catch (e) {
        console.error('[Listing Intelligence] Cost tracking error:', e);
      }

      return NextResponse.json({
        success: true,
        analysisId: analysis.id,
        result: {
          overallScore: result.overallScore,
          heroImageIndex: result.heroImageIndex,
          heroImageUrl: result.heroImageUrl,
          totalPhotos: result.totalPhotos,
          analysisSummary: result.analysisSummary,
          competitiveBenchmark: result.competitiveBenchmark,
          estimatedDomCurrent: result.estimatedDomCurrent,
          estimatedDomOptimized: result.estimatedDomOptimized,
          photoScores: result.photoScores,
          topRecommendations: result.topRecommendations.slice(0, 10),
        },
        cost,
      });

    } catch (analysisError: any) {
      await supabase
        .from('listing_analyses')
        .update({ status: 'failed', error_message: analysisError.message })
        .eq('id', analysis.id);
      throw analysisError;
    }

  } catch (error: any) {
    console.error('[Listing Intelligence] API Error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
