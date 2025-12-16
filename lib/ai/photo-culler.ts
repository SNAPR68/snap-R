import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PhotoCullScore {
  photoIndex: number;
  photoUrl: string;
  qualityScore: number;
  blurScore: number;
  exposureScore: number;
  compositionScore: number;
  roomType: string;
  isExterior: boolean;
  isDuplicate: boolean;
  duplicateOfIndex?: number;
  similarityScore?: number;
  isSelected: boolean;
  selectionReason: string;
  recommendedOrder?: number;
  aiFeedback: string;
}

export interface CullSessionResult {
  sessionId?: string;
  totalPhotos: number;
  selectedPhotos: PhotoCullScore[];
  rejectedPhotos: PhotoCullScore[];
  duplicateGroups: { original: number; duplicates: number[] }[];
  roomTypeCounts: Record<string, number>;
  averageQuality: number;
  processingTime: number;
}

const BATCH_ANALYSIS_PROMPT = `You are an expert real estate photographer who must select the BEST photos for an MLS listing.

Analyze ALL photos in this batch and for EACH photo provide:

1. QUALITY SCORES (0-100):
   - blur_score: Sharpness (100=tack sharp, 0=unusably blurry)
   - exposure_score: Proper exposure (100=perfect, 0=blown out or too dark)
   - composition_score: Professional framing, angles, rule of thirds

2. ROOM TYPE: Identify from this list:
   exterior-front, exterior-back, exterior-side, exterior-aerial, exterior-pool, exterior-yard, exterior-patio,
   living-room, family-room, kitchen, dining-room, breakfast-nook,
   master-bedroom, bedroom, master-bathroom, bathroom, half-bath,
   office, den, bonus-room, laundry, mudroom, foyer, hallway,
   garage, basement, attic, closet, other

3. DUPLICATE DETECTION:
   - Identify photos that are essentially the same shot (slightly different angle or exposure)
   - Group duplicates together and pick the BEST one from each group

4. SELECTION LOGIC:
   - Goal: Select the best 25 photos (or whatever target)
   - Must include: 1-3 exterior front (hero candidates), at least 1 of each major room
   - Prefer: Sharp, well-lit, well-composed shots
   - Reject: Blurry, dark, redundant, unflattering angles
   - Order: Hero exterior first, then exterior->common areas->bedrooms->bathrooms->details

RESPOND IN THIS EXACT JSON FORMAT:
{
  "photos": [
    {
      "index": 0,
      "quality_score": 85,
      "blur_score": 90,
      "exposure_score": 80,
      "composition_score": 85,
      "room_type": "exterior-front",
      "is_exterior": true,
      "is_duplicate": false,
      "duplicate_of_index": null,
      "similarity_score": null,
      "is_selected": true,
      "selection_reason": "Strong hero candidate - excellent curb appeal shot",
      "recommended_order": 1,
      "feedback": "Sharp exterior with good lighting. Best front elevation shot."
    }
  ],
  "duplicate_groups": [
    {"original": 3, "duplicates": [4, 5]}
  ]
}`;

export async function analyzePhotosForCulling(
  photoUrls: string[],
  targetCount: number = 25
): Promise<{
  scores: PhotoCullScore[];
  duplicateGroups: { original: number; duplicates: number[] }[];
}> {
  console.log(`[Photo Culling] Analyzing ${photoUrls.length} photos, target: ${targetCount}`);
  
  // For large batches, process in chunks of 20 (GPT-4V can handle ~20 images well)
  const chunkSize = 20;
  const allScores: PhotoCullScore[] = [];
  const allDuplicateGroups: { original: number; duplicates: number[] }[] = [];
  
  for (let i = 0; i < photoUrls.length; i += chunkSize) {
    const chunk = photoUrls.slice(i, i + chunkSize);
    const chunkStartIndex = i;
    
    console.log(`[Photo Culling] Processing chunk ${Math.floor(i / chunkSize) + 1} (photos ${i + 1}-${Math.min(i + chunkSize, photoUrls.length)})`);
    
    try {
      const imageContent = chunk.map((url, idx) => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'low' as const }
      }));

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: `${BATCH_ANALYSIS_PROMPT}\n\nThere are ${chunk.length} photos in this batch (indices ${chunkStartIndex}-${chunkStartIndex + chunk.length - 1}). Target selection: ${targetCount} total photos. Analyze each photo:` 
            },
            ...imageContent
          ]
        }],
        max_tokens: 4000,
        temperature: 0.2,
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

      const result = JSON.parse(jsonStr);
      
      // Map results to our format
      const chunkScores: PhotoCullScore[] = (result.photos || []).map((p: any) => ({
        photoIndex: chunkStartIndex + (p.index || 0),
        photoUrl: photoUrls[chunkStartIndex + (p.index || 0)] || '',
        qualityScore: p.quality_score || 50,
        blurScore: p.blur_score || 50,
        exposureScore: p.exposure_score || 50,
        compositionScore: p.composition_score || 50,
        roomType: p.room_type || 'other',
        isExterior: p.is_exterior || p.room_type?.startsWith('exterior') || false,
        isDuplicate: p.is_duplicate || false,
        duplicateOfIndex: p.duplicate_of_index !== null ? chunkStartIndex + p.duplicate_of_index : undefined,
        similarityScore: p.similarity_score,
        isSelected: p.is_selected || false,
        selectionReason: p.selection_reason || '',
        recommendedOrder: p.recommended_order,
        aiFeedback: p.feedback || '',
      }));
      
      allScores.push(...chunkScores);
      
      // Adjust duplicate group indices to global
      if (result.duplicate_groups) {
        const adjustedGroups = result.duplicate_groups.map((g: any) => ({
          original: chunkStartIndex + g.original,
          duplicates: (g.duplicates || []).map((d: number) => chunkStartIndex + d)
        }));
        allDuplicateGroups.push(...adjustedGroups);
      }
      
    } catch (error: any) {
      console.error(`[Photo Culling] Error in chunk ${Math.floor(i / chunkSize) + 1}:`, error.message);
      // Generate default scores for failed chunk
      chunk.forEach((url, idx) => {
        allScores.push({
          photoIndex: chunkStartIndex + idx,
          photoUrl: url,
          qualityScore: 50,
          blurScore: 50,
          exposureScore: 50,
          compositionScore: 50,
          roomType: 'other',
          isExterior: false,
          isDuplicate: false,
          isSelected: false,
          selectionReason: 'Unable to analyze - included by default',
          aiFeedback: 'Analysis failed for this photo',
        });
      });
    }
    
    // Rate limit between chunks
    if (i + chunkSize < photoUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Sort by quality and apply final selection logic
  const finalScores = applySelectionLogic(allScores, targetCount, allDuplicateGroups);
  
  return {
    scores: finalScores,
    duplicateGroups: allDuplicateGroups,
  };
}

function applySelectionLogic(
  scores: PhotoCullScore[],
  targetCount: number,
  duplicateGroups: { original: number; duplicates: number[] }[]
): PhotoCullScore[] {
  // Mark all duplicates as not selected (keep only originals)
  const duplicateIndices = new Set<number>();
  duplicateGroups.forEach(group => {
    group.duplicates.forEach(d => duplicateIndices.add(d));
  });
  
  scores.forEach(score => {
    if (duplicateIndices.has(score.photoIndex)) {
      score.isSelected = false;
      score.isDuplicate = true;
      score.selectionReason = 'Duplicate of another photo';
    }
  });
  
  // Get non-duplicate photos sorted by quality
  const candidates = scores
    .filter(s => !duplicateIndices.has(s.photoIndex))
    .sort((a, b) => b.qualityScore - a.qualityScore);
  
  // Selection strategy: ensure variety
  const selected: PhotoCullScore[] = [];
  const roomTypeSelected: Record<string, number> = {};
  
  // Priority 1: Best exterior front (hero)
  const exteriorFronts = candidates.filter(s => s.roomType === 'exterior-front');
  if (exteriorFronts.length > 0) {
    exteriorFronts[0].isSelected = true;
    exteriorFronts[0].recommendedOrder = 1;
    exteriorFronts[0].selectionReason = 'Hero image - best exterior front';
    selected.push(exteriorFronts[0]);
    roomTypeSelected['exterior-front'] = 1;
  }
  
  // Priority 2: One of each major room type
  const majorRoomTypes = [
    'kitchen', 'living-room', 'master-bedroom', 'master-bathroom',
    'dining-room', 'family-room', 'exterior-back', 'exterior-pool'
  ];
  
  majorRoomTypes.forEach(roomType => {
    if (selected.length >= targetCount) return;
    const roomPhotos = candidates.filter(s => 
      s.roomType === roomType && !selected.includes(s)
    );
    if (roomPhotos.length > 0) {
      roomPhotos[0].isSelected = true;
      roomPhotos[0].selectionReason = `Best ${roomType.replace('-', ' ')} shot`;
      selected.push(roomPhotos[0]);
      roomTypeSelected[roomType] = (roomTypeSelected[roomType] || 0) + 1;
    }
  });
  
  // Priority 3: Fill remaining slots with highest quality non-selected
  const remaining = candidates.filter(s => !selected.includes(s));
  let orderCounter = selected.length + 1;
  
  for (const photo of remaining) {
    if (selected.length >= targetCount) break;
    
    // Limit same room type to max 4
    const roomCount = roomTypeSelected[photo.roomType] || 0;
    if (roomCount >= 4) continue;
    
    photo.isSelected = true;
    photo.recommendedOrder = orderCounter++;
    photo.selectionReason = `High quality ${photo.roomType.replace('-', ' ')}`;
    selected.push(photo);
    roomTypeSelected[photo.roomType] = roomCount + 1;
  }
  
  // Apply recommended ordering based on MLS best practices
  const orderPriority: Record<string, number> = {
    'exterior-front': 1,
    'exterior-aerial': 2,
    'exterior-back': 3,
    'exterior-pool': 4,
    'exterior-yard': 5,
    'exterior-patio': 6,
    'foyer': 10,
    'living-room': 11,
    'family-room': 12,
    'kitchen': 15,
    'dining-room': 16,
    'breakfast-nook': 17,
    'master-bedroom': 20,
    'master-bathroom': 21,
    'bedroom': 25,
    'bathroom': 26,
    'office': 30,
    'den': 31,
    'bonus-room': 32,
    'laundry': 40,
    'garage': 45,
    'other': 50,
  };
  
  selected.sort((a, b) => {
    const aOrder = orderPriority[a.roomType] || 50;
    const bOrder = orderPriority[b.roomType] || 50;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.qualityScore - a.qualityScore;
  });
  
  selected.forEach((photo, idx) => {
    photo.recommendedOrder = idx + 1;
  });
  
  // Update original scores array with selection results
  const selectedIndices = new Set(selected.map(s => s.photoIndex));
  scores.forEach(score => {
    const selectedPhoto = selected.find(s => s.photoIndex === score.photoIndex);
    if (selectedPhoto) {
      score.isSelected = true;
      score.recommendedOrder = selectedPhoto.recommendedOrder;
      score.selectionReason = selectedPhoto.selectionReason;
    } else if (!score.isDuplicate) {
      score.isSelected = false;
      score.selectionReason = score.selectionReason || 'Lower quality than selected photos';
    }
  });
  
  return scores;
}

export async function runCullSession(
  photoUrls: string[],
  targetCount: number = 25
): Promise<CullSessionResult> {
  const startTime = Date.now();
  
  const { scores, duplicateGroups } = await analyzePhotosForCulling(photoUrls, targetCount);
  
  const selectedPhotos = scores.filter(s => s.isSelected).sort((a, b) => 
    (a.recommendedOrder || 999) - (b.recommendedOrder || 999)
  );
  const rejectedPhotos = scores.filter(s => !s.isSelected);
  
  // Count room types
  const roomTypeCounts: Record<string, number> = {};
  scores.forEach(s => {
    roomTypeCounts[s.roomType] = (roomTypeCounts[s.roomType] || 0) + 1;
  });
  
  const averageQuality = Math.round(
    scores.reduce((sum, s) => sum + s.qualityScore, 0) / scores.length
  );
  
  const processingTime = Date.now() - startTime;
  
  console.log(`[Photo Culling] Complete: ${selectedPhotos.length} selected, ${rejectedPhotos.length} rejected, ${duplicateGroups.length} duplicate groups`);
  
  return {
    totalPhotos: photoUrls.length,
    selectedPhotos,
    rejectedPhotos,
    duplicateGroups,
    roomTypeCounts,
    averageQuality,
    processingTime,
  };
}

export function calculateCullingCost(photoCount: number): number {
  // Using low detail images: ~$0.005 per image
  return photoCount * 0.005;
}

// Export selected photos in MLS-ready order with sequential naming
export function generateMLSExport(
  selectedPhotos: PhotoCullScore[],
  listingAddress?: string
): { filename: string; url: string; order: number }[] {
  const prefix = listingAddress 
    ? listingAddress.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)
    : 'listing';
  
  return selectedPhotos
    .sort((a, b) => (a.recommendedOrder || 0) - (b.recommendedOrder || 0))
    .map((photo, idx) => ({
      filename: `${prefix}_${String(idx + 1).padStart(2, '0')}.jpg`,
      url: photo.photoUrl,
      order: idx + 1,
    }));
}
