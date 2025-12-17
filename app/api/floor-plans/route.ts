export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { PLAN_TYPES, calculatePrice, getEstimatedDelivery } from '@/lib/floorplans/config';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Analyze photos with GPT-4 Vision
async function analyzePhotos(photoUrls: string[]) {
  if (!OPENAI_API_KEY || photoUrls.length === 0) return null;

  try {
    const imageContent = photoUrls.slice(0, 8).map(url => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'high' as const },
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate floor plan analyst. Analyze property photos to identify all rooms, estimate sizes, and understand the layout. Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these property photos and identify all rooms.

Return JSON:
{
  "rooms": [
    {"name": "Living Room", "type": "living", "sqft": 350, "floor": 1, "features": ["fireplace"]},
    {"name": "Master Bedroom", "type": "bedroom", "sqft": 200, "floor": 1, "features": ["walk-in closet"]}
  ],
  "totalSqft": 2500,
  "floors": 1,
  "bedrooms": 3,
  "bathrooms": 2,
  "style": "modern ranch",
  "layout": "open-concept"
}`,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Photo analysis error:', error);
    return null;
  }
}

// Generate floor plan image with DALL-E 3
async function generateFloorPlanImage(analysis: any, style: string, colorScheme: string) {
  if (!OPENAI_API_KEY) return null;

  try {
    const roomList = analysis.rooms?.map((r: any) => `${r.name} (${r.sqft || r.estimatedSqft} sq ft)`).join(', ') || 'standard rooms';

    const styleMap: Record<string, string> = {
      modern: 'clean minimalist architectural style with thin black lines',
      classic: 'traditional blueprint architectural drawing style',
      minimal: 'ultra-simple black and white schematic diagram',
      detailed: 'detailed floor plan with furniture icons and fixtures shown',
    };

    const colorMap: Record<string, string> = {
      color: 'with soft pastel colors for different rooms (blue for bedrooms, green for bathrooms, yellow for kitchen, purple for living areas)',
      grayscale: 'in professional black, white and gray tones',
      blueprint: 'in classic blueprint style with white lines on dark blue background',
    };

    const prompt = `Professional 2D architectural floor plan, top-down bird's eye view.

Property: ${analysis.floors || 1}-story ${analysis.style || 'modern'} home
Total: ${analysis.totalSqft || 2000} square feet
Rooms: ${roomList}
Layout: ${analysis.bedrooms || 3} bedrooms, ${analysis.bathrooms || 2} bathrooms

Style: ${styleMap[style] || styleMap.modern}
Colors: ${colorMap[colorScheme] || colorMap.color}

Requirements:
- Clean top-down architectural view
- All rooms clearly labeled with names
- Room dimensions shown
- Doors as gaps in walls, windows as thin lines
- Total square footage displayed
- Professional MLS-ready quality
- White or light background (unless blueprint)
- No 3D perspective, pure 2D overhead view`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural',
      }),
    });

    if (!response.ok) {
      console.error('DALL-E error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0]?.url || null;
  } catch (error) {
    console.error('Floor plan generation error:', error);
    return null;
  }
}

// Upload image to Supabase storage
async function uploadToStorage(imageUrl: string, floorPlanId: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    const fileName = `floor-plans/${floorPlanId}.png`;
    
    const { error } = await serviceSupabase.storage
      .from('raw-images')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Storage error:', error);
      return null;
    }

    const { data: urlData } = serviceSupabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// POST - Generate floor plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      listingId,
      planType = '2d-basic',
      style = 'modern',
      colorScheme = 'color',
      sourcePhotos = [],
      propertyDetails = {},
      options = {},
      rushOrder = false,
    } = body;

    // Validate plan type
    if (!PLAN_TYPES[planType as keyof typeof PLAN_TYPES]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const price = calculatePrice(planType, { rush: rushOrder });
    const planConfig = PLAN_TYPES[planType as keyof typeof PLAN_TYPES];

    // Create floor plan record
    const { data: floorPlan, error: createError } = await serviceSupabase
      .from('floor_plans')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        name: propertyDetails.address || 'AI Generated Floor Plan',
        plan_type: planType,
        total_sqft: propertyDetails.sqft || null,
        bedrooms: propertyDetails.bedrooms || null,
        bathrooms: propertyDetails.bathrooms || null,
        floors: propertyDetails.floors || 1,
        source_photos: sourcePhotos,
        style,
        color_scheme: colorScheme,
        status: 'processing',
        price_paid: price,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create error:', createError);
      return NextResponse.json({ error: 'Failed to create floor plan' }, { status: 500 });
    }

    // Step 1: Analyze photos with GPT-4 Vision
    let analysis = null;
    if (sourcePhotos.length > 0) {
      console.log('Analyzing', sourcePhotos.length, 'photos...');
      analysis = await analyzePhotos(sourcePhotos);
    }

    // If no analysis from photos, use property details
    if (!analysis) {
      analysis = {
        rooms: [],
        totalSqft: propertyDetails.sqft || 2000,
        floors: propertyDetails.floors || 1,
        bedrooms: propertyDetails.bedrooms || 3,
        bathrooms: propertyDetails.bathrooms || 2,
        style: 'modern',
        layout: 'open-concept',
      };

      // Generate basic room list
      const beds = propertyDetails.bedrooms || 3;
      const baths = propertyDetails.bathrooms || 2;
      
      analysis.rooms = [
        { name: 'Living Room', type: 'living', sqft: 300, floor: 1, features: [] },
        { name: 'Kitchen', type: 'kitchen', sqft: 200, floor: 1, features: ['island'] },
        { name: 'Dining Room', type: 'dining', sqft: 150, floor: 1, features: [] },
      ];

      for (let i = 0; i < beds; i++) {
        analysis.rooms.push({
          name: i === 0 ? 'Master Bedroom' : `Bedroom ${i + 1}`,
          type: 'bedroom',
          sqft: i === 0 ? 200 : 150,
          floor: 1,
          features: i === 0 ? ['walk-in closet', 'en-suite'] : [],
        });
      }

      for (let i = 0; i < baths; i++) {
        analysis.rooms.push({
          name: i === 0 ? 'Master Bath' : `Bathroom ${i + 1}`,
          type: 'bathroom',
          sqft: i === 0 ? 80 : 50,
          floor: 1,
          features: [],
        });
      }
    }

    // Step 2: Generate floor plan image with DALL-E 3
    console.log('Generating floor plan image...');
    const dalleImageUrl = await generateFloorPlanImage(analysis, style, colorScheme);

    if (!dalleImageUrl) {
      // Fall back to manual order
      const estimatedDelivery = getEstimatedDelivery(planType, rushOrder);
      
      await serviceSupabase
        .from('floor_plans')
        .update({ 
          status: 'pending',
          processing_method: 'manual',
          rooms: analysis.rooms,
        })
        .eq('id', floorPlan.id);

      // Create manual order
      await serviceSupabase
        .from('floor_plan_orders')
        .insert({
          user_id: user.id,
          floor_plan_id: floorPlan.id,
          listing_id: listingId || null,
          plan_type: planType,
          rush_order: rushOrder,
          base_price: planConfig.price,
          rush_fee: rushOrder ? Math.round(planConfig.price * 0.5) : 0,
          total_price: price,
          status: 'pending',
          estimated_delivery: estimatedDelivery.toISOString(),
        });

      return NextResponse.json({
        success: true,
        floorPlanId: floorPlan.id,
        status: 'pending',
        message: 'AI generation unavailable. Your floor plan is being processed manually.',
        estimatedDelivery,
        price,
        analysis,
      });
    }

    // Step 3: Upload to Supabase storage
    console.log('Uploading to storage...');
    const permanentUrl = await uploadToStorage(dalleImageUrl, floorPlan.id);
    const finalUrl = permanentUrl || dalleImageUrl;

    // Update floor plan with result
    await serviceSupabase
      .from('floor_plans')
      .update({
        status: 'completed',
        processing_method: 'ai-generated',
        image_url: finalUrl,
        rooms: analysis.rooms,
        total_sqft: analysis.totalSqft,
        bedrooms: analysis.bedrooms,
        bathrooms: analysis.bathrooms,
        completed_at: new Date().toISOString(),
      })
      .eq('id', floorPlan.id);

    return NextResponse.json({
      success: true,
      floorPlanId: floorPlan.id,
      imageUrl: finalUrl,
      status: 'completed',
      analysis,
      processingMethod: 'ai-generated',
    });

  } catch (error: any) {
    console.error('Floor plan API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's floor plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    let query = serviceSupabase
      .from('floor_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete floor plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await serviceSupabase
      .from('floor_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
