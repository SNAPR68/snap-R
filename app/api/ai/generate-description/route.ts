export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  generateListingDescription, 
  calculateDescriptionCost,
  DescriptionTone,
  DescriptionLength 
} from '@/lib/ai/description-generator';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      listingId, 
      photoUrls, 
      tone = 'professional', 
      length = 'medium',
      listingData = {}
    } = body;

    // Validate inputs
    if (!listingId && (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0)) {
      return NextResponse.json({ 
        error: 'Either listingId or photoUrls array is required' 
      }, { status: 400 });
    }

    if (!['professional', 'luxury', 'casual', 'first_time_buyer'].includes(tone)) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 });
    }

    if (!['short', 'medium', 'full'].includes(length)) {
      return NextResponse.json({ error: 'Invalid length' }, { status: 400 });
    }

    let photos: string[] = photoUrls || [];
    let listing: any = listingData;

    // If listingId provided, fetch listing and photos
    if (listingId) {
      const { data: listingRecord, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError || !listingRecord) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      listing = {
        title: listingRecord.title,
        address: listingRecord.address,
        city: listingRecord.city,
        state: listingRecord.state,
        beds: listingRecord.bedrooms,
        baths: listingRecord.bathrooms,
        sqft: listingRecord.sqft,
        price: listingRecord.price,
        propertyType: listingRecord.property_type,
        ...listingData, // Allow overrides
      };

      // Fetch photos if not provided
      if (photos.length === 0) {
        const { data: photosData } = await supabase
          .from('photos')
          .select('raw_url, processed_url')
          .eq('listing_id', listingId)
          .order('created_at', { ascending: true });

        if (photosData && photosData.length > 0) {
          // Get signed URLs for photos
          photos = await Promise.all(
            photosData.map(async (photo) => {
              const path = photo.processed_url || photo.raw_url;
              const { data } = await supabase.storage
                .from('raw-images')
                .createSignedUrl(path, 3600);
              return data?.signedUrl || '';
            })
          );
          photos = photos.filter(url => url !== '');
        }
      }
    }

    if (photos.length === 0) {
      return NextResponse.json({ 
        error: 'No photos available for analysis' 
      }, { status: 400 });
    }

    console.log(`[AI Description] Generating for ${photos.length} photos, tone: ${tone}, length: ${length}`);

    // Generate description
    const result = await generateListingDescription(
      photos,
      listing,
      tone as DescriptionTone,
      length as DescriptionLength
    );

    const cost = calculateDescriptionCost(photos.length);
    const processingTime = Date.now() - startTime;

    // Save to database
    const { data: savedDescription, error: saveError } = await supabase
      .from('ai_descriptions')
      .insert({
        listing_id: listingId || null,
        user_id: user.id,
        tone,
        length,
        content: result.description,
        headline: result.headline,
        photo_analysis: result.photoAnalysis,
        detected_features: result.detectedFeatures,
        seo_keywords: result.seoKeywords,
        character_count: result.characterCount,
        word_count: result.wordCount,
        model_used: 'gpt-4o',
        generation_cost: cost,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[AI Description] Save error:', saveError);
      // Continue anyway - return result even if save fails
    }

    // Track API cost
    try {
      await supabase.from('api_costs').insert({
        user_id: user.id,
        provider: 'openai',
        tool: 'ai-description',
        model: 'gpt-4o',
        input_tokens: photos.length * 500 + 500,
        output_tokens: result.wordCount * 2,
        cost,
        metadata: { 
          listing_id: listingId,
          tone,
          length,
          photo_count: photos.length,
          processing_time_ms: processingTime,
        },
      });
    } catch (e) {
      console.error('[AI Description] Cost tracking error:', e);
    }

    console.log(`[AI Description] Complete in ${(processingTime / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      descriptionId: savedDescription?.id,
      headline: result.headline,
      description: result.description,
      seoKeywords: result.seoKeywords,
      detectedFeatures: result.detectedFeatures,
      photoAnalysis: result.photoAnalysis,
      stats: {
        characterCount: result.characterCount,
        wordCount: result.wordCount,
        tone,
        length,
        photosAnalyzed: Math.min(photos.length, 10),
      },
      cost,
      processingTime,
    });

  } catch (error: any) {
    console.error('[AI Description] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate description' 
    }, { status: 500 });
  }
}

// GET - Fetch saved descriptions for a listing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const descriptionId = searchParams.get('id');

    if (descriptionId) {
      // Fetch single description
      const { data, error } = await supabase
        .from('ai_descriptions')
        .select('*')
        .eq('id', descriptionId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Description not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // Fetch all descriptions for a listing or user
    let query = supabase
      .from('ai_descriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch descriptions' }, { status: 500 });
    }

    return NextResponse.json(data || []);

  } catch (error: any) {
    console.error('[AI Description] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
