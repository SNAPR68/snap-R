import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PhotoAnalysis {
  photoIndex: number;
  photoUrl: string;
  overallScore: number;
  lightingScore: number;
  compositionScore: number;
  clarityScore: number;
  appealScore: number;
  roomType: string;
  isExterior: boolean;
  isHeroCandidate: boolean;
  heroPotential: number;
  recommendations: EnhancementRecommendation[];
  enhancementPotential: number;
  aiFeedback: string;
}

export interface EnhancementRecommendation {
  toolId: string;
  toolName: string;
  priority: number;
  impactEstimate: number;
  impactDescription: string;
  reason: string;
}

export interface ListingAnalysis {
  overallScore: number;
  heroImageIndex: number;
  heroImageUrl: string;
  totalPhotos: number;
  analysisSummary: string;
  competitiveBenchmark: string;
  estimatedDomCurrent: number;
  estimatedDomOptimized: number;
  photoScores: PhotoAnalysis[];
  topRecommendations: (EnhancementRecommendation & { photoIndex: number; photoUrl: string })[];
}

const PHOTO_ANALYSIS_PROMPT = `You are an expert real estate photo analyst with 20+ years experience. Analyze this property photo.

SCORING (0-100 each):
1. Lighting: Natural light quality, shadows, exposure balance
2. Composition: Rule of thirds, angles, framing, perspective
3. Clarity: Sharpness, focus, resolution quality
4. Appeal: Emotional impact, buyer desire, magazine-worthiness

ROOM TYPE (identify exactly): exterior-front, exterior-back, exterior-aerial, exterior-pool, exterior-yard, living-room, family-room, kitchen, dining-room, master-bedroom, bedroom, master-bathroom, bathroom, office, garage, patio, deck, other

HERO POTENTIAL (1-10): Rate suitability as the FIRST photo buyers see on MLS/Zillow
- 9-10: Perfect hero - will stop scrollers
- 7-8: Strong candidate
- 5-6: Acceptable but not ideal
- 1-4: Poor choice

ENHANCEMENT RECOMMENDATIONS - List specific improvements with these tool IDs:
sky-replacement, virtual-twilight, lawn-repair, pool-enhancement, declutter, virtual-staging, fire-in-fireplace, tv-screen-replacement, lights-on, window-masking, hdr-enhancement, perspective-correction, lens-correction, color-balance, auto-enhance

RESPOND IN THIS EXACT JSON FORMAT ONLY (no markdown, no explanation):
{
  "overallScore": 75,
  "lightingScore": 70,
  "compositionScore": 80,
  "clarityScore": 75,
  "appealScore": 72,
  "roomType": "exterior-front",
  "isExterior": true,
  "heroPotential": 8,
  "recommendations": [
    {"toolId": "sky-replacement", "toolName": "Sky Replacement", "priority": 1, "impactEstimate": 30, "impactDescription": "+30%", "reason": "Overcast sky reduces curb appeal"}
  ],
  "enhancementPotential": 35,
  "aiFeedback": "Good composition but overcast sky and slightly dark exposure reduce appeal. Sky replacement and HDR would significantly improve engagement."
}`;

export async function analyzePhoto(photoUrl: string, photoIndex: number): Promise<PhotoAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PHOTO_ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: photoUrl, detail: 'high' } }
        ]
      }],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    let jsonStr = content.trim();
    
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];
    }

    const analysis = JSON.parse(jsonStr);
    
    return {
      photoIndex,
      photoUrl,
      overallScore: analysis.overallScore || Math.round(
        (analysis.lightingScore * 0.25) + (analysis.compositionScore * 0.25) +
        (analysis.clarityScore * 0.20) + (analysis.appealScore * 0.30)
      ),
      lightingScore: analysis.lightingScore || 50,
      compositionScore: analysis.compositionScore || 50,
      clarityScore: analysis.clarityScore || 50,
      appealScore: analysis.appealScore || 50,
      roomType: analysis.roomType || 'unknown',
      isExterior: analysis.isExterior || analysis.roomType?.startsWith('exterior') || false,
      isHeroCandidate: (analysis.heroPotential || 5) >= 7,
      heroPotential: analysis.heroPotential || 5,
      recommendations: analysis.recommendations || [],
      enhancementPotential: analysis.enhancementPotential || 30,
      aiFeedback: analysis.aiFeedback || 'Analysis completed',
    };
  } catch (error: any) {
    console.error(`[Listing Intelligence] Error analyzing photo ${photoIndex}:`, error.message);
    return {
      photoIndex, photoUrl, overallScore: 50, lightingScore: 50, compositionScore: 50,
      clarityScore: 50, appealScore: 50, roomType: 'unknown', isExterior: false,
      isHeroCandidate: false, heroPotential: 5, recommendations: [],
      enhancementPotential: 30, aiFeedback: 'Analysis failed - using default scores',
    };
  }
}

export async function analyzePhotoBatch(photoUrls: string[], concurrency = 3): Promise<PhotoAnalysis[]> {
  const results: PhotoAnalysis[] = [];
  
  for (let i = 0; i < photoUrls.length; i += concurrency) {
    const batch = photoUrls.slice(i, i + concurrency);
    const batchPromises = batch.map((url, idx) => analyzePhoto(url, i + idx));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (i + concurrency < photoUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

export async function analyzeListingPhotos(photoUrls: string[]): Promise<ListingAnalysis> {
  console.log(`[Listing Intelligence] Analyzing ${photoUrls.length} photos...`);
  
  const photoScores = await analyzePhotoBatch(photoUrls);
  
  const overallScore = Math.round(
    photoScores.reduce((sum, p) => sum + p.overallScore, 0) / photoScores.length
  );
  
  const sortedByHero = [...photoScores].sort((a, b) => b.heroPotential - a.heroPotential);
  const heroImage = sortedByHero[0];
  
  const allRecommendations: (EnhancementRecommendation & { photoIndex: number; photoUrl: string })[] = [];
  photoScores.forEach(photo => {
    photo.recommendations.forEach(rec => {
      allRecommendations.push({
        ...rec,
        photoIndex: photo.photoIndex,
        photoUrl: photo.photoUrl,
      });
    });
  });
  allRecommendations.sort((a, b) => b.impactEstimate - a.impactEstimate);
  
  const baseDOM = 45;
  const qualityFactor = (100 - overallScore) / 100;
  const estimatedDomCurrent = Math.round(baseDOM * (1 + qualityFactor * 0.5));
  
  const avgEnhancementPotential = photoScores.reduce((s, p) => s + p.enhancementPotential, 0) / photoScores.length;
  const improvementFactor = (avgEnhancementPotential / 100) * 0.32;
  const estimatedDomOptimized = Math.round(estimatedDomCurrent * (1 - improvementFactor));
  
  let analysisSummary = '';
  if (overallScore >= 85) analysisSummary = 'Excellent photo quality! Your listing photos are professional-grade. ';
  else if (overallScore >= 70) analysisSummary = 'Good photo quality with room for improvement. ';
  else if (overallScore >= 55) analysisSummary = 'Average quality - AI enhancements would help compete effectively. ';
  else analysisSummary = 'Below average - we strongly recommend applying AI enhancements. ';
  
  if (allRecommendations.length > 0) {
    analysisSummary += `Top opportunity: ${allRecommendations[0].toolName} on photo #${allRecommendations[0].photoIndex + 1} (${allRecommendations[0].impactDescription} potential boost).`;
  }
  
  let competitiveBenchmark = '';
  if (overallScore >= 90) competitiveBenchmark = 'Top 5% - Your photos outperform 95% of competing listings.';
  else if (overallScore >= 80) competitiveBenchmark = 'Top 15% - Better than most competitors.';
  else if (overallScore >= 70) competitiveBenchmark = 'Top 30% - Above average but room to stand out.';
  else if (overallScore >= 60) competitiveBenchmark = 'Average - Matches typical listings. Enhancements would differentiate.';
  else competitiveBenchmark = 'Below Average - Improvements needed to compete effectively.';
  
  console.log(`[Listing Intelligence] Analysis complete. Score: ${overallScore}/100`);
  
  return {
    overallScore,
    heroImageIndex: heroImage.photoIndex,
    heroImageUrl: heroImage.photoUrl,
    totalPhotos: photoUrls.length,
    analysisSummary,
    competitiveBenchmark,
    estimatedDomCurrent,
    estimatedDomOptimized,
    photoScores,
    topRecommendations: allRecommendations.slice(0, 10),
  };
}

export function calculateAnalysisCost(photoCount: number): number {
  return photoCount * 0.025;
}
