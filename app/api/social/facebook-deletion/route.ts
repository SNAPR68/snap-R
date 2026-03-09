import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import { logger } from '@/lib/logger';
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Facebook sends a signed request when user requests data deletion
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    // Parse and verify the signed request
    const [encodedSig, payload] = signedRequest.split('.');
    if (!encodedSig || !payload) {
      return NextResponse.json({ error: 'Invalid signed_request format' }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature using Facebook App Secret
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (appSecret) {
      const expectedSig = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest();
      const actualSig = Buffer.from(encodedSig, 'base64url');

      if (
        actualSig.length !== expectedSig.length ||
        !crypto.timingSafeEqual(actualSig, expectedSig)
      ) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    const userId = data.user_id;

    // Delete user's social connection data
    if (userId) {
      await getSupabase()
        .from('social_connections')
        .delete()
        .eq('platform_user_id', userId);
    }

    // Generate a confirmation code
    const confirmationCode = crypto.randomBytes(16).toString('hex');
    
    // Facebook expects this specific response format
    return NextResponse.json({
      url: `https://snap-r.com/deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode
    });

  } catch (error: unknown) {
    logger.error('Facebook deletion callback error:', error);
    // Still return success to Facebook
    return NextResponse.json({
      url: 'https://snap-r.com/deletion-status',
      confirmation_code: 'error-handled'
    });
  }
}

// GET endpoint for status check page
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  return NextResponse.json({ 
    status: 'complete',
    message: 'Your data has been deleted from SnapR',
    confirmation_code: code 
  });
}

