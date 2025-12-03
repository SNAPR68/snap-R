export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {},
  };

  // Check Supabase
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.services.supabase = error ? 'unhealthy' : 'healthy';
  } catch (e) {
    checks.services.supabase = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check environment variables
  checks.services.stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing';
  checks.services.resend = process.env.RESEND_API_KEY ? 'configured' : 'missing';
  checks.services.replicate = process.env.REPLICATE_API_TOKEN ? 'configured' : 'missing';
  checks.services.runware = process.env.RUNWARE_API_KEY ? 'configured' : 'missing';

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
