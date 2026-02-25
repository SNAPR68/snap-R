import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Sentry test route — only enabled in development
export function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  throw new Error('Sentry example error — this only fires in development');
}
