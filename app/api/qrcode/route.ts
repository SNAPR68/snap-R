import { NextResponse } from 'next/server'
import { qrcodeSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
// Generate QR code using external API
export async function POST(request: Request) {
  try {
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
