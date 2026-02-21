export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const REQUIRED_VARS = [
  'REMOTION_AWS_REGION',
  'REMOTION_AWS_ACCESS_KEY_ID',
  'REMOTION_AWS_SECRET_ACCESS_KEY',
  'REMOTION_LAMBDA_FUNCTION_NAME',
  'REMOTION_S3_BUCKET_NAME',
  'REMOTION_LAMBDA_SERVE_URL',
];

export async function GET() {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    return NextResponse.json(
      { configured: false, missing },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: true,
    functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME,
    region: process.env.REMOTION_AWS_REGION,
  });
}
