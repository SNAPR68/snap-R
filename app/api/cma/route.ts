export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface Comparable {
  address: string;
  soldPrice: number;
  soldDate: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
}

interface CMARequest {
  listing: {
    id: string;
    title?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    year_built?: number;
    property_type?: string;
    photos?: { id: string; url: string }[];
  };
  comparables: Comparable[];
  pricing: {
    recommended: number;
    rangeLow: number;
    rangeHigh: number;
  };
  agentInfo: {
    name: string;
    phone: string;
    email: string;
    brokerage: string;
  };
}

// Generate market narrative using GPT-4
async function generateMarketNarrative(
  listing: CMARequest['listing'],
  comparables: Comparable[],
  pricing: CMARequest['pricing']
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return `Based on an analysis of ${comparables.length} comparable properties in the area, we recommend listing this property at $${pricing.recommended.toLocaleString()}. The price range of $${pricing.rangeLow.toLocaleString()} to $${pricing.rangeHigh.toLocaleString()} reflects current market conditions and comparable sales activity.`;
  }

  const avgPrice = comparables.reduce((sum, c) => sum + c.soldPrice, 0) / comparables.length;
  const avgPricePerSqft = comparables.reduce((sum, c) => sum + (c.soldPrice / c.sqft), 0) / comparables.length;

  const prompt = `Write a professional 2-3 paragraph market analysis narrative for a CMA report. Be concise and factual.

Subject Property:
- Address: ${listing.address || 'N/A'}
- ${listing.bedrooms || '?'} bedrooms, ${listing.bathrooms || '?'} bathrooms
- ${listing.sqft?.toLocaleString() || '?'} square feet
- Year Built: ${listing.year_built || 'N/A'}

Comparable Sales Data:
${comparables.map((c, i) => `${i + 1}. ${c.address} - Sold for $${c.soldPrice.toLocaleString()} ($${(c.soldPrice / c.sqft).toFixed(0)}/sqft) - ${c.bedrooms}bd/${c.bathrooms}ba, ${c.sqft.toLocaleString()} sqft`).join('\n')}

Market Analysis:
- Average sale price: $${Math.round(avgPrice).toLocaleString()}
- Average price per sqft: $${avgPricePerSqft.toFixed(0)}
- Recommended list price: $${pricing.recommended.toLocaleString()}
- Price range: $${pricing.rangeLow.toLocaleString()} - $${pricing.rangeHigh.toLocaleString()}

Write a professional narrative explaining the pricing recommendation based on the comparables. Do not use headers or bullet points. Just flowing paragraphs.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional real estate analyst writing CMA reports. Be factual, professional, and concise.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate narrative');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Narrative generation error:', error);
    return `Based on an analysis of ${comparables.length} comparable properties in the area, we recommend listing this property at $${pricing.recommended.toLocaleString()}. The comparable sales range from $${Math.min(...comparables.map(c => c.soldPrice)).toLocaleString()} to $${Math.max(...comparables.map(c => c.soldPrice)).toLocaleString()}, with an average price per square foot of $${(comparables.reduce((sum, c) => sum + (c.soldPrice / c.sqft), 0) / comparables.length).toFixed(0)}.`;
  }
}

// Generate HTML report (will be converted to PDF)
function generateHTMLReport(
  listing: CMARequest['listing'],
  comparables: Comparable[],
  pricing: CMARequest['pricing'],
  agentInfo: CMARequest['agentInfo'],
  narrative: string
): string {
  const avgPricePerSqft = comparables.reduce((sum, c) => sum + (c.soldPrice / c.sqft), 0) / comparables.length;
  const subjectPricePerSqft = listing.sqft && pricing.recommended ? pricing.recommended / listing.sqft : 0;
  
  const fullAddress = [listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(', ');
  const heroPhoto = listing.photos?.[0]?.url || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: letter; margin: 0.5in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; }
    
    .page { page-break-after: always; min-height: 10in; padding: 0.25in; }
    .page:last-child { page-break-after: avoid; }
    
    /* Cover Page */
    .cover { 
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      position: relative;
    }
    .cover-title { font-size: 14px; letter-spacing: 3px; text-transform: uppercase; color: #d4af37; margin-bottom: 20px; }
    .cover-address { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .cover-details { font-size: 18px; color: #888; margin-bottom: 40px; }
    .cover-price { font-size: 48px; font-weight: bold; color: #d4af37; }
    .cover-price-label { font-size: 14px; color: #888; margin-top: 5px; }
    .cover-agent { position: absolute; bottom: 40px; text-align: center; }
    .cover-agent-name { font-size: 18px; font-weight: bold; }
    .cover-agent-info { font-size: 14px; color: #888; }
    
    /* Headers */
    .section-header { 
      font-size: 24px; 
      font-weight: bold; 
      color: #1a1a1a;
      border-bottom: 3px solid #d4af37;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    /* Property Details */
    .property-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .property-stat { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .property-stat-value { font-size: 28px; font-weight: bold; color: #1a1a1a; }
    .property-stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    
    /* Photos Grid */
    .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px; }
    .photo { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; background: #eee; }
    
    /* Comparables Table */
    .comp-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
    .comp-table th { background: #1a1a1a; color: white; padding: 12px 8px; text-align: left; font-weight: 600; }
    .comp-table td { padding: 10px 8px; border-bottom: 1px solid #eee; }
    .comp-table tr:nth-child(even) { background: #f9f9f9; }
    .comp-table .subject { background: #fff8e7 !important; font-weight: bold; }
    .comp-table .price { color: #d4af37; font-weight: bold; }
    
    /* Analysis */
    .analysis-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .analysis-title { font-weight: bold; margin-bottom: 10px; }
    .analysis-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .analysis-item { text-align: center; }
    .analysis-value { font-size: 24px; font-weight: bold; color: #d4af37; }
    .analysis-label { font-size: 12px; color: #666; }
    
    /* Narrative */
    .narrative { background: white; border-left: 4px solid #d4af37; padding: 20px; margin-bottom: 30px; }
    .narrative p { margin-bottom: 15px; }
    .narrative p:last-child { margin-bottom: 0; }
    
    /* Agent Footer */
    .agent-section { 
      background: #1a1a1a; 
      color: white; 
      padding: 30px; 
      border-radius: 8px; 
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .agent-name { font-size: 24px; font-weight: bold; }
    .agent-brokerage { color: #d4af37; margin-top: 5px; }
    .agent-contact { text-align: right; }
    .agent-contact div { margin-bottom: 5px; }
    
    /* Price Chart Visual */
    .price-bar-container { margin: 20px 0; }
    .price-bar { height: 40px; background: #eee; border-radius: 20px; position: relative; overflow: hidden; }
    .price-bar-fill { height: 100%; background: linear-gradient(90deg, #d4af37, #f4d03f); border-radius: 20px; }
    .price-markers { display: flex; justify-content: space-between; margin-top: 5px; font-size: 12px; color: #666; }
    
    /* Footer */
    .footer { 
      text-align: center; 
      font-size: 10px; 
      color: #888; 
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover">
    <div class="cover-title">Comparative Market Analysis</div>
    <div class="cover-address">${fullAddress || 'Property Address'}</div>
    <div class="cover-details">
      ${[
        listing.bedrooms && `${listing.bedrooms} Bed`,
        listing.bathrooms && `${listing.bathrooms} Bath`,
        listing.sqft && `${listing.sqft.toLocaleString()} Sqft`
      ].filter(Boolean).join(' • ') || 'Property Details'}
    </div>
    <div class="cover-price">$${pricing.recommended.toLocaleString()}</div>
    <div class="cover-price-label">Recommended List Price</div>
    <div class="cover-agent">
      <div class="cover-agent-name">${agentInfo.name || 'Agent Name'}</div>
      <div class="cover-agent-info">${agentInfo.brokerage || ''}</div>
      <div class="cover-agent-info">${agentInfo.phone || ''} • ${agentInfo.email || ''}</div>
    </div>
  </div>

  <!-- Property Overview -->
  <div class="page">
    <div class="section-header">Subject Property</div>
    
    <div class="property-grid">
      <div class="property-stat">
        <div class="property-stat-value">${listing.bedrooms || '—'}</div>
        <div class="property-stat-label">Bedrooms</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-value">${listing.bathrooms || '—'}</div>
        <div class="property-stat-label">Bathrooms</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-value">${listing.sqft?.toLocaleString() || '—'}</div>
        <div class="property-stat-label">Square Feet</div>
      </div>
      <div class="property-stat">
        <div class="property-stat-value">${listing.year_built || '—'}</div>
        <div class="property-stat-label">Year Built</div>
      </div>
    </div>

    ${listing.photos && listing.photos.length > 0 ? `
    <div class="photos-grid">
      ${listing.photos.slice(0, 6).map(photo => `
        <img src="${photo.url}" class="photo" alt="Property photo" />
      `).join('')}
    </div>
    ` : ''}

    <div class="analysis-box">
      <div class="analysis-title">Pricing Summary</div>
      <div class="analysis-grid">
        <div class="analysis-item">
          <div class="analysis-value">$${pricing.recommended.toLocaleString()}</div>
          <div class="analysis-label">Recommended Price</div>
        </div>
        <div class="analysis-item">
          <div class="analysis-value">$${subjectPricePerSqft.toFixed(0)}</div>
          <div class="analysis-label">Price per Sqft</div>
        </div>
        <div class="analysis-item">
          <div class="analysis-value">$${pricing.rangeLow.toLocaleString()} - $${pricing.rangeHigh.toLocaleString()}</div>
          <div class="analysis-label">Price Range</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Prepared by ${agentInfo.name || 'Agent'} | ${agentInfo.brokerage || ''} | ${new Date().toLocaleDateString()}
    </div>
  </div>

  <!-- Comparable Sales -->
  <div class="page">
    <div class="section-header">Comparable Sales Analysis</div>
    
    <table class="comp-table">
      <thead>
        <tr>
          <th>Address</th>
          <th>Sale Price</th>
          <th>Beds</th>
          <th>Baths</th>
          <th>Sqft</th>
          <th>$/Sqft</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <tr class="subject">
          <td><strong>SUBJECT:</strong> ${listing.address || 'Subject Property'}</td>
          <td class="price">$${pricing.recommended.toLocaleString()}</td>
          <td>${listing.bedrooms || '—'}</td>
          <td>${listing.bathrooms || '—'}</td>
          <td>${listing.sqft?.toLocaleString() || '—'}</td>
          <td>$${subjectPricePerSqft.toFixed(0)}</td>
          <td>—</td>
        </tr>
        ${comparables.map((comp, i) => `
        <tr>
          <td><strong>Comp ${i + 1}:</strong> ${comp.address}</td>
          <td class="price">$${comp.soldPrice.toLocaleString()}</td>
          <td>${comp.bedrooms}</td>
          <td>${comp.bathrooms}</td>
          <td>${comp.sqft.toLocaleString()}</td>
          <td>$${(comp.soldPrice / comp.sqft).toFixed(0)}</td>
          <td>${comp.soldDate ? new Date(comp.soldDate).toLocaleDateString() : '—'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="analysis-box">
      <div class="analysis-title">Comparable Sales Summary</div>
      <div class="analysis-grid">
        <div class="analysis-item">
          <div class="analysis-value">$${Math.round(comparables.reduce((s, c) => s + c.soldPrice, 0) / comparables.length).toLocaleString()}</div>
          <div class="analysis-label">Average Sale Price</div>
        </div>
        <div class="analysis-item">
          <div class="analysis-value">$${avgPricePerSqft.toFixed(0)}</div>
          <div class="analysis-label">Average $/Sqft</div>
        </div>
        <div class="analysis-item">
          <div class="analysis-value">${comparables.length}</div>
          <div class="analysis-label">Comparables Analyzed</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Prepared by ${agentInfo.name || 'Agent'} | ${agentInfo.brokerage || ''} | ${new Date().toLocaleDateString()}
    </div>
  </div>

  <!-- Market Analysis -->
  <div class="page">
    <div class="section-header">Market Analysis</div>
    
    <div class="narrative">
      ${narrative.split('\n\n').map(p => `<p>${p}</p>`).join('')}
    </div>

    <div class="section-header" style="margin-top: 40px;">Price Positioning</div>
    
    <div class="price-bar-container">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-size: 14px; color: #666;">Lower Price Range</span>
        <span style="font-size: 14px; color: #666;">Higher Price Range</span>
      </div>
      <div class="price-bar">
        <div class="price-bar-fill" style="width: ${Math.min(100, Math.max(0, ((pricing.recommended - pricing.rangeLow) / (pricing.rangeHigh - pricing.rangeLow)) * 100))}%;"></div>
      </div>
      <div class="price-markers">
        <span>$${pricing.rangeLow.toLocaleString()}</span>
        <span style="font-weight: bold; color: #d4af37;">$${pricing.recommended.toLocaleString()} (Recommended)</span>
        <span>$${pricing.rangeHigh.toLocaleString()}</span>
      </div>
    </div>

    <div class="agent-section" style="margin-top: 60px;">
      <div>
        <div class="agent-name">${agentInfo.name || 'Your Agent'}</div>
        <div class="agent-brokerage">${agentInfo.brokerage || ''}</div>
      </div>
      <div class="agent-contact">
        <div>📞 ${agentInfo.phone || ''}</div>
        <div>✉️ ${agentInfo.email || ''}</div>
      </div>
    </div>

    <div class="footer">
      This Comparative Market Analysis is intended to assist in establishing a listing price and is not an appraisal.
      <br/>Generated by SnapR • ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>
`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CMARequest = await request.json();
    const { listing, comparables, pricing, agentInfo } = body;

    if (!listing || !comparables || comparables.length === 0 || !pricing) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Generate AI narrative
    const narrative = await generateMarketNarrative(listing, comparables, pricing);

    // Generate HTML report
    const htmlReport = generateHTMLReport(listing, comparables, pricing, agentInfo, narrative);

    // For now, return HTML as base64 data URL (can be opened in browser and printed to PDF)
    // In production, you'd use puppeteer or a PDF service to convert HTML to PDF
    const reportBase64 = Buffer.from(htmlReport).toString('base64');
    const reportUrl = `data:text/html;base64,${reportBase64}`;

    // Save CMA record
    await serviceSupabase
      .from('cma_reports')
      .insert({
        user_id: user.id,
        listing_id: listing.id,
        comparables: comparables,
        pricing: pricing,
        agent_info: agentInfo,
        narrative: narrative,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      reportUrl,
      narrative,
      stats: {
        avgPrice: Math.round(comparables.reduce((s, c) => s + c.soldPrice, 0) / comparables.length),
        avgPricePerSqft: comparables.reduce((s, c) => s + (c.soldPrice / c.sqft), 0) / comparables.length,
        comparablesCount: comparables.length,
      },
    });
  } catch (error: any) {
    console.error('CMA API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's CMA history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: reports, error } = await serviceSupabase
      .from('cma_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Table might not exist yet - return empty array
      return NextResponse.json([]);
    }

    return NextResponse.json(reports || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
