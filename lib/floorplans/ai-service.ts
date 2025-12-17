// AI Floor Plan Generation Service
// Uses GPT-4 Vision to analyze photos + DALL-E 3 to generate floor plans

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface RoomAnalysis {
  rooms: {
    name: string;
    type: string;
    estimatedSqft: number;
    floor: number;
    features: string[];
  }[];
  totalSqft: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  layout: string;
  style: string;
  notes: string;
}

interface FloorPlanResult {
  success: boolean;
  imageUrl?: string;
  analysis?: RoomAnalysis;
  error?: string;
  processingMethod: string;
}

// Step 1: Analyze photos with GPT-4 Vision to understand the layout
export async function analyzePropertyPhotos(photoUrls: string[]): Promise<RoomAnalysis | null> {
  if (!OPENAI_API_KEY || photoUrls.length === 0) return null;

  try {
    const imageContent = photoUrls.slice(0, 10).map(url => ({
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
            content: `You are an expert real estate floor plan analyst. Analyze property photos to identify:
1. All rooms visible (living room, bedrooms, bathrooms, kitchen, dining, etc.)
2. Estimate square footage for each room based on visual cues
3. Identify the architectural style (modern, traditional, colonial, craftsman, etc.)
4. Note special features (fireplace, island kitchen, walk-in closet, etc.)
5. Estimate total square footage and number of floors

Be thorough but realistic in your estimates. Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these property photos and create a detailed room breakdown.

Return JSON in this exact format:
{
  "rooms": [
    {"name": "Living Room", "type": "living", "estimatedSqft": 350, "floor": 1, "features": ["fireplace", "large windows"]},
    {"name": "Master Bedroom", "type": "bedroom", "estimatedSqft": 200, "floor": 2, "features": ["walk-in closet", "en-suite"]},
    ...
  ],
  "totalSqft": 2500,
  "floors": 2,
  "bedrooms": 4,
  "bathrooms": 3,
  "layout": "open-concept",
  "style": "modern",
  "notes": "Split-level home with vaulted ceilings in living area"
}`,
              },
              ...imageContent,
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI Vision error:', await response.text());
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

// Step 2: Generate floor plan image with DALL-E 3
export async function generateFloorPlanImage(
  analysis: RoomAnalysis,
  style: string = 'modern',
  colorScheme: string = 'color'
): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;

  try {
    // Build a detailed prompt for DALL-E based on the room analysis
    const roomDescriptions = analysis.rooms
      .map(r => `${r.name} (${r.estimatedSqft} sq ft)`)
      .join(', ');

    const styleGuide = {
      modern: 'clean minimalist lines, contemporary design',
      classic: 'traditional architectural blueprint style',
      minimal: 'ultra-simple black and white schematic',
      detailed: 'detailed with furniture icons and fixtures',
    }[style] || 'clean modern style';

    const colorGuide = {
      color: 'with soft pastel colors for different rooms (light blue for bedrooms, light green for living areas, light yellow for kitchen)',
      grayscale: 'in professional black and white with gray shading',
      blueprint: 'in classic blueprint style with white lines on dark blue background',
    }[colorScheme] || 'with soft colors';

    const prompt = `Professional 2D architectural floor plan of a ${analysis.floors}-story ${analysis.style} home with ${analysis.totalSqft} square feet. 

Layout includes: ${roomDescriptions}.

Style: ${styleGuide}, ${colorGuide}.

The floor plan should be:
- Top-down view, professionally drawn
- Clear room labels with dimensions
- Doors and windows marked
- Clean white background (unless blueprint style)
- Total sqft shown: ${analysis.totalSqft} sq ft
- ${analysis.bedrooms} bedrooms, ${analysis.bathrooms} bathrooms clearly labeled

Make it look like a professional real estate floor plan ready for MLS listing.`;

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
      const errorText = await response.text();
      console.error('DALL-E error:', errorText);
      return null;
    }

    const data = await response.json();
    return data.data[0]?.url || null;
  } catch (error) {
    console.error('Floor plan generation error:', error);
    return null;
  }
}

// Step 3: Upload generated image to Supabase Storage
export async function uploadFloorPlanToStorage(
  imageUrl: string,
  floorPlanId: string,
  supabase: any
): Promise<string | null> {
  try {
    // Fetch the image from DALL-E URL
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    const fileName = `floor-plans/${floorPlanId}.png`;
    
    const { data, error } = await supabase.storage
      .from('raw-images')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('raw-images')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// Main function: Generate complete floor plan
export async function generateAIFloorPlan(
  photoUrls: string[],
  options: {
    style?: string;
    colorScheme?: string;
    propertyDetails?: {
      sqft?: number;
      bedrooms?: number;
      bathrooms?: number;
      floors?: number;
    };
  } = {}
): Promise<FloorPlanResult> {
  const { style = 'modern', colorScheme = 'color', propertyDetails } = options;

  // Step 1: Analyze photos
  console.log('Analyzing photos with GPT-4 Vision...');
  let analysis = await analyzePropertyPhotos(photoUrls);

  if (!analysis) {
    // If photo analysis fails, create a basic analysis from property details
    if (propertyDetails?.sqft || propertyDetails?.bedrooms) {
      analysis = {
        rooms: [],
        totalSqft: propertyDetails.sqft || 2000,
        floors: propertyDetails.floors || 1,
        bedrooms: propertyDetails.bedrooms || 3,
        bathrooms: propertyDetails.bathrooms || 2,
        layout: 'traditional',
        style: 'modern',
        notes: 'Generated from property details',
      };

      // Create basic rooms
      if (propertyDetails.bedrooms) {
        for (let i = 0; i < propertyDetails.bedrooms; i++) {
          analysis.rooms.push({
            name: i === 0 ? 'Master Bedroom' : `Bedroom ${i + 1}`,
            type: 'bedroom',
            estimatedSqft: i === 0 ? 200 : 150,
            floor: propertyDetails.floors && propertyDetails.floors > 1 ? 2 : 1,
            features: i === 0 ? ['walk-in closet'] : [],
          });
        }
      }
      
      analysis.rooms.push(
        { name: 'Living Room', type: 'living', estimatedSqft: 300, floor: 1, features: [] },
        { name: 'Kitchen', type: 'kitchen', estimatedSqft: 200, floor: 1, features: ['island'] },
        { name: 'Dining Room', type: 'dining', estimatedSqft: 150, floor: 1, features: [] }
      );

      for (let i = 0; i < (propertyDetails.bathrooms || 2); i++) {
        analysis.rooms.push({
          name: i === 0 ? 'Master Bath' : `Bathroom ${i + 1}`,
          type: 'bathroom',
          estimatedSqft: i === 0 ? 80 : 50,
          floor: i === 0 && propertyDetails.floors && propertyDetails.floors > 1 ? 2 : 1,
          features: i === 0 ? ['double vanity', 'shower'] : ['tub/shower combo'],
        });
      }
    } else {
      return {
        success: false,
        error: 'Could not analyze photos. Please provide property details.',
        processingMethod: 'failed',
      };
    }
  }

  // Step 2: Generate floor plan image
  console.log('Generating floor plan with DALL-E 3...');
  const imageUrl = await generateFloorPlanImage(analysis, style, colorScheme);

  if (!imageUrl) {
    return {
      success: false,
      analysis,
      error: 'Failed to generate floor plan image. Try again.',
      processingMethod: 'partial',
    };
  }

  return {
    success: true,
    imageUrl,
    analysis,
    processingMethod: 'ai-generated',
  };
}

// Generate SVG floor plan as fallback (for when DALL-E fails)
export function generateSVGFloorPlan(analysis: RoomAnalysis, colorScheme: string = 'color'): string {
  const width = 800;
  const height = 600;
  const padding = 50;
  
  const colors = {
    color: {
      bedroom: '#E3F2FD',
      bathroom: '#E8F5E9',
      kitchen: '#FFF3E0',
      living: '#F3E5F5',
      dining: '#FBE9E7',
      default: '#F5F5F5',
    },
    grayscale: {
      bedroom: '#E0E0E0',
      bathroom: '#BDBDBD',
      kitchen: '#9E9E9E',
      living: '#EEEEEE',
      dining: '#F5F5F5',
      default: '#FAFAFA',
    },
    blueprint: {
      bedroom: '#1565C0',
      bathroom: '#1976D2',
      kitchen: '#1E88E5',
      living: '#2196F3',
      dining: '#42A5F5',
      default: '#0D47A1',
    },
  }[colorScheme] || colors.color;

  const textColor = colorScheme === 'blueprint' ? '#FFFFFF' : '#333333';
  const bgColor = colorScheme === 'blueprint' ? '#0D47A1' : '#FFFFFF';
  
  const rooms = analysis.rooms.filter(r => r.floor === 1);
  const cols = Math.ceil(Math.sqrt(rooms.length));
  const rows = Math.ceil(rooms.length / cols);
  const cellWidth = (width - padding * 2) / cols;
  const cellHeight = (height - padding * 2 - 40) / rows;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <style>
      .room-name { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: ${textColor}; }
      .room-size { font-family: Arial, sans-serif; font-size: 11px; fill: ${textColor}; opacity: 0.7; }
      .title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; fill: ${textColor}; }
      .subtitle { font-family: Arial, sans-serif; font-size: 12px; fill: ${textColor}; opacity: 0.6; }
    </style>
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="${width/2}" y="30" text-anchor="middle" class="title">Floor Plan</text>
    <text x="${width/2}" y="50" text-anchor="middle" class="subtitle">${analysis.totalSqft} sq ft | ${analysis.bedrooms} Bed | ${analysis.bathrooms} Bath</text>
  `;
  
  rooms.forEach((room, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + col * cellWidth + 5;
    const y = padding + 30 + row * cellHeight + 5;
    const w = cellWidth - 10;
    const h = cellHeight - 10;
    
    const roomColor = colors[room.type as keyof typeof colors] || colors.default;
    
    svg += `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${roomColor}" stroke="${textColor}" stroke-width="2" rx="4"/>
      <text x="${x + w/2}" y="${y + h/2 - 8}" text-anchor="middle" class="room-name">${room.name}</text>
      <text x="${x + w/2}" y="${y + h/2 + 12}" text-anchor="middle" class="room-size">${room.estimatedSqft} sq ft</text>
    `;
  });
  
  svg += '</svg>';
  return svg;
}
