import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, status, message } = body;
    
    console.log(`[PrepareNotification] Listing: ${listingId}, Status: ${status}, Message: ${message}`);
    
    // For now, just acknowledge the notification
    // Later: send WhatsApp, email, or push notification
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PrepareNotification] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
