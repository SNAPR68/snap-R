// Floor Plan Service
// Handles AI generation via CubiCasa and manual order processing

import { calculateCredits, getEstimatedDelivery } from './config';

const CUBICASA_API_KEY = process.env.CUBICASA_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface FloorPlanRequest {
  listingId?: string;
  planType: string;
  style: string;
  colorScheme: string;
  sourcePhotos: string[];
  propertyDetails: {
    address?: string;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
    floors?: number;
  };
  options: {
    showDimensions: boolean;
    showFurniture: boolean;
    showRoomNames: boolean;
    showSqft: boolean;
    includeBranding: boolean;
    brandLogoUrl?: string;
  };
}

interface FloorPlanResult {
  success: boolean;
  imageUrl?: string;
  pdfUrl?: string;
  rooms?: any[];
  error?: string;
  processingMethod?: string;
}

// CubiCasa API Integration (when available)
async function generateWithCubiCasa(photos: string[]): Promise<FloorPlanResult | null> {
  if (!CUBICASA_API_KEY) {
    console.log('CubiCasa API key not configured');
    return null;
  }

  try {
    // CubiCasa requires a video or sequence of photos
    // This is a placeholder for when we integrate their API
    const response = await fetch('https://api.cubicasa.com/v1/floorplans', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CUBICASA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: photos,
        output_format: 'png',
        include_3d: false,
      }),
    });

    if (!response.ok) {
      console.error('CubiCasa API error:', await response.text());
      return null;
    }

    const data = await response.json();
    
    return {
      success: true,
      imageUrl: data.floor_plan_url,
      pdfUrl: data.pdf_url,
      rooms: data.rooms,
      processingMethod: 'cubicasa',
    };
  } catch (error) {
    console.error('CubiCasa error:', error);
    return null;
  }
}

// AI-assisted floor plan generation using GPT-4 Vision
async function analyzePhotosForLayout(photos: string[]): Promise<any> {
  if (!OPENAI_API_KEY || photos.length === 0) return null;

  try {
    const imageContent = photos.slice(0, 10).map(url => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'low' as const },
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
            content: `You are a real estate floor plan analyst. Analyze property photos to identify rooms, estimate sizes, and suggest a floor plan layout. Return JSON only.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these property photos and identify:
1. All visible rooms and their approximate sizes in sqft
2. Room connections/flow
3. Number of floors
4. Total estimated sqft
5. Suggested room layout

Return as JSON:
{
  "rooms": [{"name": "Living Room", "type": "living-room", "estimatedSqft": 350, "floor": 1, "features": ["fireplace", "large windows"]}],
  "totalSqft": 2000,
  "floors": 1,
  "bedrooms": 3,
  "bathrooms": 2,
  "layout": "open-concept" or "traditional",
  "notes": "any important observations"
}`,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI error:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Photo analysis error:', error);
    return null;
  }
}

// Generate a simple SVG floor plan from room data
function generateSimpleFloorPlan(rooms: any[], options: any): string {
  const width = 800;
  const height = 600;
  const padding = 40;
  
  // Simple grid layout for rooms
  const cols = Math.ceil(Math.sqrt(rooms.length));
  const rows = Math.ceil(rooms.length / cols);
  const cellWidth = (width - padding * 2) / cols;
  const cellHeight = (height - padding * 2) / rows;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <style>
      .room { fill: #f5f5f5; stroke: #333; stroke-width: 2; }
      .room-name { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #333; }
      .room-size { font-family: Arial, sans-serif; font-size: 11px; fill: #666; }
      .dimension { font-family: Arial, sans-serif; font-size: 10px; fill: #999; }
    </style>
    <rect width="100%" height="100%" fill="white"/>
    <text x="${width/2}" y="25" text-anchor="middle" class="room-name" style="font-size: 18px;">Floor Plan</text>
  `;
  
  rooms.forEach((room, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + col * cellWidth;
    const y = padding + 20 + row * cellHeight;
    const w = cellWidth - 10;
    const h = cellHeight - 10;
    
    svg += `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="room" rx="4"/>
      <text x="${x + w/2}" y="${y + h/2 - 8}" text-anchor="middle" class="room-name">${room.name}</text>
    `;
    
    if (options.showSqft && room.estimatedSqft) {
      svg += `<text x="${x + w/2}" y="${y + h/2 + 10}" text-anchor="middle" class="room-size">${room.estimatedSqft} sq ft</text>`;
    }
  });
  
  svg += '</svg>';
  return svg;
}

// Main floor plan generation function
export async function generateFloorPlan(request: FloorPlanRequest): Promise<FloorPlanResult> {
  // Try CubiCasa first (if configured)
  if (request.sourcePhotos.length > 0) {
    const cubiResult = await generateWithCubiCasa(request.sourcePhotos);
    if (cubiResult?.success) {
      return cubiResult;
    }
  }
  
  // Fallback: Analyze photos with GPT-4 Vision
  if (request.sourcePhotos.length > 0) {
    const analysis = await analyzePhotosForLayout(request.sourcePhotos);
    
    if (analysis?.rooms) {
      // Generate a simple SVG floor plan
      const svg = generateSimpleFloorPlan(analysis.rooms, request.options);
      
      // Convert SVG to data URL (in production, upload to storage)
      const svgBase64 = Buffer.from(svg).toString('base64');
      const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      return {
        success: true,
        imageUrl: svgDataUrl,
        rooms: analysis.rooms,
        processingMethod: 'ai-assisted',
      };
    }
  }
  
  // If no photos or AI fails, create an order for manual processing
  return {
    success: false,
    error: 'Automatic generation not available. Order will be processed manually.',
    processingMethod: 'manual',
  };
}

// Create a manual order for professional floor plan
export async function createManualOrder(
  userId: string,
  listingId: string,
  planType: string,
  rush: boolean,
  instructions: string
): Promise<{ orderId: string; estimatedDelivery: Date; price: number }> {
  const { calculatePrice } = await import('./config');
  
  const price = calculatePrice(planType, { rush });
  const estimatedDelivery = getEstimatedDelivery(planType, rush);
  
  // In production, this would create a record in floor_plan_orders
  // and potentially integrate with a fulfillment service
  
  return {
    orderId: crypto.randomUUID(),
    estimatedDelivery,
    price,
  };
}

// Upload a floor plan (for photographers who have their own)
export async function uploadFloorPlan(
  file: File,
  metadata: {
    listingId?: string;
    sqft?: number;
    bedrooms?: number;
    bathrooms?: number;
  }
): Promise<FloorPlanResult> {
  // In production, this would upload to Supabase Storage
  // and create a floor_plans record
  
  return {
    success: true,
    imageUrl: URL.createObjectURL(file),
    processingMethod: 'upload',
  };
}
