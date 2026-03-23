import { NextRequest, NextResponse } from 'next/server'
import { qrcodeSchema, parseBody } from '@/lib/validation/schemas'
import { checkRateLimitAsync } from '@/lib/rate-limit'
import { logger } from '@/lib/logger';

// Generate QR code using external API
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 req/min per IP to prevent resource abuse
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { success: withinLimit } = await checkRateLimitAsync(`qrcode:${ip}`, 10, 60_000);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await request.json(); const validated = parseBody(qrcodeSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { url, size = 200, color = '000000' } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Use QR Server API (free, no auth required)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=${color}&bgcolor=FFFFFF&format=png`

    return NextResponse.json({ qrCodeUrl: qrUrl })
  } catch (error: unknown) {
    logger.error('QR code error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
