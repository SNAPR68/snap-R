import { NextResponse } from 'next/server'

// Generate QR code using external API
export async function POST(request: Request) {
  try {
    const { url, size = 200, color = '000000' } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Use QR Server API (free, no auth required)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=${color}&bgcolor=FFFFFF&format=png`

    return NextResponse.json({ qrCodeUrl: qrUrl })
  } catch (error) {
    console.error('QR code error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
