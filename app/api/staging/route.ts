export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Furniture style details for prompts
const FURNITURE_STYLES: Record<string, { label: string; keywords: string; furniture: Record<string, string> }> = {
  modern: {
    label: 'Modern',
    keywords: 'modern minimalist contemporary clean sleek simple geometric',
    furniture: {
      'living-room': 'sleek sectional sofa in neutral fabric, glass coffee table, minimalist armchairs, abstract wall art, modern floor lamp, geometric area rug',
      'bedroom': 'low platform bed with upholstered headboard, floating nightstands, sleek dresser, modern pendant lights, minimalist bedding',
      'dining-room': 'rectangular glass dining table, upholstered dining chairs, linear chandelier, modern sideboard',
      'office': 'modern white desk, ergonomic mesh chair, minimalist floating shelves, sleek task lamp',
      'master-suite': 'king platform bed, matching modern nightstands, contemporary chaise lounge, designer lighting',
      'kids-room': 'modern twin bed, colorful storage cubes, sleek desk, playful modern decor',
    },
  },
  scandinavian: {
    label: 'Scandinavian',
    keywords: 'scandinavian nordic hygge light airy functional cozy minimal pale wood',
    furniture: {
      'living-room': 'light gray linen sofa, light oak coffee table, sheepskin throws, pendant lamp, potted plants, woven baskets',
      'bedroom': 'light wood bed frame, white linen bedding, woven jute rug, simple wooden nightstands, soft lighting',
      'dining-room': 'light oak round dining table, mix of wooden chairs, simple pendant light, greenery centerpiece',
      'office': 'light birch wood desk, white molded chair, open wooden shelving, plants',
      'master-suite': 'light wood king bed, matching pale nightstands, cozy textiles, natural light',
      'kids-room': 'simple white bed, natural wood toys, soft pastel accents, cozy textiles',
    },
  },
  farmhouse: {
    label: 'Farmhouse',
    keywords: 'farmhouse rustic country barn shiplap reclaimed wood cozy warm',
    furniture: {
      'living-room': 'comfortable linen sofa, reclaimed wood coffee table, woven baskets, vintage lanterns, cozy throw blankets',
      'bedroom': 'wooden farmhouse bed frame, quilted bedding, rustic wooden nightstands, vintage mirror',
      'dining-room': 'large farmhouse dining table, mixed seating with bench, industrial pendant lighting, open shelving',
      'office': 'rustic wood desk, vintage leather chair, galvanized metal accents, mason jar organizers',
      'master-suite': 'wooden king bed with headboard, matching rustic nightstands, cozy quilts',
      'kids-room': 'white farmhouse bed, vintage toy chest, country-style decor',
    },
  },
  luxury: {
    label: 'Luxury',
    keywords: 'luxury high-end opulent premium designer marble gold velvet crystal elegant',
    furniture: {
      'living-room': 'tufted velvet sofa, marble coffee table, crystal chandelier, designer art pieces, gold accent furniture',
      'bedroom': 'upholstered king bed with tall headboard, mirrored nightstands, silk bedding, crystal chandelier',
      'dining-room': 'polished glass dining table, velvet upholstered chairs, crystal chandelier, gold flatware display',
      'office': 'executive mahogany desk, leather tufted chair, built-in bookshelves, designer lamp',
      'master-suite': 'luxurious king bed, designer nightstands, chaise lounge, statement chandelier',
      'kids-room': 'elegant canopy bed, plush seating, sophisticated decor in soft colors',
    },
  },
  coastal: {
    label: 'Coastal',
    keywords: 'coastal beach nautical ocean breezy relaxed blue white sand',
    furniture: {
      'living-room': 'white slipcovered sofa, rattan coffee table, blue throw pillows, seagrass rug, coral and shell decor',
      'bedroom': 'white wooden bed frame, blue and white striped bedding, wicker furniture, ocean artwork',
      'dining-room': 'white dining table, wicker dining chairs, blue glassware, driftwood centerpiece',
      'office': 'white desk, rattan chair, coastal artwork, blue accessories',
      'master-suite': 'white king bed, light blue accents, beach-inspired decor',
      'kids-room': 'nautical themed bed, ocean colors, beach decor',
    },
  },
  industrial: {
    label: 'Industrial',
    keywords: 'industrial urban loft exposed brick metal concrete pipes raw',
    furniture: {
      'living-room': 'distressed leather sofa, metal and wood coffee table, factory pendant lights, exposed shelving',
      'bedroom': 'metal bed frame, concrete-look nightstand, edison bulb lighting, brick accent wall',
      'dining-room': 'reclaimed wood table with metal legs, mismatched metal chairs, industrial chandelier',
      'office': 'pipe desk with wood top, vintage metal chair, wire storage baskets, industrial task lamp',
      'master-suite': 'industrial king bed frame, raw wood nightstands, metal accents',
      'kids-room': 'industrial twin bed, metal storage, urban decor',
    },
  },
  midcentury: {
    label: 'Mid-Century Modern',
    keywords: 'mid-century retro vintage 1950s 1960s atomic teak walnut iconic',
    furniture: {
      'living-room': 'iconic mid-century lounge chair, teak credenza, starburst wall clock, geometric rug, sputnik chandelier',
      'bedroom': 'walnut bed frame with tapered legs, vintage-style nightstands, retro lamp, abstract art',
      'dining-room': 'oval tulip table, molded plastic chairs, teak sideboard, arc floor lamp',
      'office': 'walnut desk with hairpin legs, eames-style chair, teak bookshelf, globe lamp',
      'master-suite': 'mid-century king bed, matching walnut furniture, retro lighting',
      'kids-room': 'retro-inspired bed, colorful atomic decor, vintage toys',
    },
  },
  traditional: {
    label: 'Traditional',
    keywords: 'traditional classic elegant timeless ornate detailed formal',
    furniture: {
      'living-room': 'rolled arm sofa, carved wooden coffee table, oriental rug, brass table lamps, oil paintings',
      'bedroom': 'four poster bed, antique dresser, traditional nightstands with lamps, silk drapes',
      'dining-room': 'mahogany dining table, upholstered chairs, china cabinet, crystal chandelier',
      'office': 'executive wooden desk, leather tufted chair, built-in bookcases, banker lamp',
      'master-suite': 'traditional king bed with ornate headboard, classic nightstands, elegant drapes',
      'kids-room': 'classic twin bed, traditional dresser, timeless decor',
    },
  },
  bohemian: {
    label: 'Bohemian',
    keywords: 'bohemian boho eclectic colorful global moroccan layered textured',
    furniture: {
      'living-room': 'low colorful sofa with many pillows, moroccan poufs, layered rugs, macrame wall hanging, many plants',
      'bedroom': 'canopy bed with flowing fabrics, layered textiles, floor cushions, string lights, tapestry',
      'dining-room': 'low wooden table, floor cushions, colorful dishes, hanging plants, lanterns',
      'office': 'vintage wooden desk, rattan peacock chair, gallery wall, plants everywhere',
      'master-suite': 'bohemian king bed, layered textiles, eclectic art, global accents',
      'kids-room': 'colorful bed, creative decor, artistic elements',
    },
  },
  transitional: {
    label: 'Transitional',
    keywords: 'transitional balanced blend neutral sophisticated comfortable',
    furniture: {
      'living-room': 'comfortable neutral sofa, upholstered ottoman, clean-lined armchairs, subtle artwork, elegant lighting',
      'bedroom': 'upholstered bed in neutral fabric, matching nightstands, coordinated table lamps, soft area rug',
      'dining-room': 'rectangular dining table, parsons chairs, simple elegant chandelier, buffet',
      'office': 'classic desk with clean lines, comfortable upholstered chair, organized shelving',
      'master-suite': 'transitional king bed, elegant nightstands, sophisticated lighting',
      'kids-room': 'classic bed with modern touches, neutral with color accents',
    },
  },
};

// Quality tier settings
const QUALITY_SETTINGS: Record<string, { strength: number; steps: number; guidance: number }> = {
  quick: { strength: 0.75, steps: 25, guidance: 7.5 },
  standard: { strength: 0.70, steps: 30, guidance: 8.0 },
  premium: { strength: 0.65, steps: 35, guidance: 8.5 },
};

const CREDITS_REQUIRED: Record<string, number> = {
  quick: 3,
  standard: 5,
  premium: 8,
};

// Build comprehensive staging prompt
function buildStagingPrompt(
  roomType: string,
  furnitureStyle: string,
  qualityTier: string,
  preset: string,
  customInstructions?: string
): string {
  // Handle remove furniture preset
  if (preset === 'occupied-to-vacant') {
    return `Remove ALL furniture and ALL items from this room completely. Leave ONLY the empty room with bare walls, floor, windows, and doors. No sofas, no tables, no chairs, no decorations, no rugs, no plants, nothing. Completely empty room. Clean and vacant.`;
  }

  const style = FURNITURE_STYLES[furnitureStyle] || FURNITURE_STYLES.modern;
  const furniture = style.furniture[roomType] || style.furniture['living-room'];

  const qualityModifier = qualityTier === 'premium' 
    ? 'Ultra photorealistic rendering, magazine-quality photography, perfect natural lighting, professional interior design, 8K quality detail.'
    : qualityTier === 'standard'
    ? 'High quality realistic furniture, professional staging, good lighting and shadows.'
    : 'Good quality virtual staging with realistic furniture.';

  let prompt = `Stage this empty room with beautiful ${style.label} style furniture and decor.

FURNITURE TO ADD: ${furniture}

STYLE: ${style.keywords}

${customInstructions ? `SPECIAL REQUESTS: ${customInstructions}` : ''}

CRITICAL RULES:
- Keep the room architecture, walls, windows, ceiling, and flooring EXACTLY the same
- Do NOT modify or remove any existing architectural features
- Only ADD furniture and decorative items
- Furniture must be properly scaled to the room
- Maintain realistic perspective matching the photo
- Natural lighting and realistic shadows on furniture
- ${qualityModifier}

Professional real estate virtual staging photography quality.`;

  return prompt;
}

// Run staging via Replicate
async function runStaging(imageUrl: string, prompt: string, qualityTier: string): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) {
    console.error('Missing REPLICATE_API_TOKEN');
    return null;
  }

  const settings = QUALITY_SETTINGS[qualityTier] || QUALITY_SETTINGS.standard;

  try {
    console.log('[Staging] Starting with quality:', qualityTier);
    
    // Use FLUX Kontext for best quality staging
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-kontext-pro',
        input: {
          input_image: imageUrl,
          prompt: prompt,
          guidance_scale: settings.guidance,
          num_inference_steps: settings.steps,
          strength: settings.strength,
          output_format: 'jpg',
          output_quality: 95,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Staging] Replicate error:', errorText);
      return null;
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes max

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
      });
      result = await pollResponse.json();
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log('[Staging] Still processing... attempt', attempts);
      }
    }

    if (result.status === 'succeeded' && result.output) {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      console.log('[Staging] Complete!');
      return outputUrl;
    }

    console.error('[Staging] Failed:', result.status, result.error);
    return null;
  } catch (error) {
    console.error('[Staging] Error:', error);
    return null;
  }
}

// Upload result to storage
async function uploadToStorage(imageUrl: string, stagingId: string, userId: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    const fileName = `staging/${userId}/${stagingId}.jpg`;
    
    const { error } = await getServiceSupabase().storage
      .from('raw-images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[Staging] Storage error:', error);
      return null;
    }

    const { data: urlData } = await getServiceSupabase().storage
      .from('raw-images')
      .createSignedUrl(fileName, 3600);

    return urlData?.signedUrl || null;
  } catch (error) {
    console.error('[Staging] Upload error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      photoId,
      imageUrl,
      listingId,
      roomType = 'living-room',
      furnitureStyle = 'modern',
      qualityTier = 'standard',
      preset = 'vacant-to-staged',
      customInstructions,
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // Check credits
    const creditsRequired = CREDITS_REQUIRED[qualityTier] || 5;
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if ((profile?.credits || 0) < creditsRequired) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        creditsRequired,
        creditsAvailable: profile?.credits || 0,
      }, { status: 402 });
    }

    // Build prompt
    const prompt = buildStagingPrompt(roomType, furnitureStyle, qualityTier, preset, customInstructions);
    console.log('[Staging] Prompt length:', prompt.length);

    // Create staging record
    const stagingId = `staging-${Date.now()}`;
    
    // Run staging
    const stagedImageUrl = await runStaging(imageUrl, prompt, qualityTier);

    if (!stagedImageUrl) {
      return NextResponse.json({ error: 'Staging failed. Please try again.' }, { status: 500 });
    }

    // Upload to storage
    const permanentUrl = await uploadToStorage(stagedImageUrl, stagingId, user.id);
    const finalUrl = permanentUrl || stagedImageUrl;

    // Deduct credits
    await supabase
      .from('profiles')
      .update({ credits: (profile?.credits || 0) - creditsRequired })
      .eq('id', user.id);

    // Save staging record
    await getServiceSupabase()
      .from('enhancements')
      .insert({
        user_id: user.id,
        photo_id: photoId || null,
        listing_id: listingId || null,
        tool_id: 'virtual-staging',
        original_url: imageUrl,
        result_url: finalUrl,
        options: {
          roomType,
          furnitureStyle,
          qualityTier,
          preset,
          customInstructions,
        },
        credits_used: creditsRequired,
        processing_time_ms: Date.now() - startTime,
        status: 'completed',
      });

    const processingTime = Date.now() - startTime;
    console.log('[Staging] Total time:', (processingTime / 1000).toFixed(1), 's');

    return NextResponse.json({
      success: true,
      stagedUrl: finalUrl,
      roomType,
      furnitureStyle,
      qualityTier,
      creditsUsed: creditsRequired,
      processingTime,
    });

  } catch (error: any) {
    console.error('[Staging] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's staging history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: stagings, error } = await getServiceSupabase()
      .from('enhancements')
      .select('*')
      .eq('user_id', user.id)
      .eq('tool_id', 'virtual-staging')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json(stagings || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
