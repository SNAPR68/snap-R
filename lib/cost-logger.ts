import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// Cost estimates per provider (in cents per API call)
// Based on typical pricing - adjust as you get actual billing data
export const COST_ESTIMATES: Record<string, Record<string, number>> = {
  replicate: {
    'sky-replacement': 5,      // ~$0.05
    'virtual-twilight': 6,     // ~$0.06
    'lawn-repair': 4,          // ~$0.04
    'declutter': 5,            // ~$0.05
    'virtual-staging': 8,      // ~$0.08
    'hdr-enhancement': 3,      // ~$0.03
    'hdr': 3,
    'perspective-fix': 3,
    'default': 5,
  },
  runware: {
    'inpainting': 2,           // ~$0.02
    'upscale': 1,              // ~$0.01
    'default': 2,
  },
  openai: {
    'vision-analysis': 2,      // ~$0.02 (GPT-4 Vision)
    'quality-scoring': 2,      // ~$0.02
    'default': 2,
  },
  autoenhance: {
    'auto-enhance': 4,         // ~$0.04 (AutoEnhance.ai)
    'default': 4,
  },
};

export type AIProvider = 'replicate' | 'runware' | 'openai' | 'autoenhance';

export async function logApiCost({
  userId,
  provider,
  toolId,
  success = true,
  errorMessage,
  actualCost,
}: {
  userId?: string;
  provider: AIProvider;
  toolId?: string;
  success?: boolean;
  errorMessage?: string;
  actualCost?: number;
}) {
  const providerCosts = COST_ESTIMATES[provider] || {};
  const costCents = actualCost || providerCosts[toolId || 'default'] || providerCosts['default'] || 4;

  try {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.from('api_costs').insert({
      user_id: userId || null,
      provider,
      model: provider,
      tool_id: toolId || null,
      cost_cents: success ? costCents : 0,
      success,
      error_message: errorMessage || null,
    });

    console.log(`[CostLogger] ${provider}/${toolId}: ${costCents}¢ (${success ? 'success' : 'failed'})`);
  } catch (e) {
    console.error('[CostLogger] Failed:', e);
  }
}

export async function logSystemEvent({
  level,
  source,
  message,
  metadata,
}: {
  level: 'info' | 'warn' | 'error' | 'critical';
  source: string;
  message: string;
  metadata?: any;
}) {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.from('system_logs').insert({
      level,
      source,
      message,
      metadata: metadata || null,
    });

    if (level === 'critical') {
      await sendCriticalAlert(source, message, metadata);
    }
  } catch (e) {
    console.error('[SystemLog] Failed:', e);
  }
}

async function sendCriticalAlert(source: string, message: string, metadata?: any) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'SnapR Alerts <onboarding@resend.dev>',
      to: 'rajesh@snap-r.com',
      subject: `🚨 CRITICAL: ${source}`,
      html: `
        <div style="font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px;">
          <h2 style="color: #ff4444;">🚨 Critical Error Alert</h2>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          ${metadata ? `<pre style="background: #000; padding: 10px; overflow: auto;">${JSON.stringify(metadata, null, 2)}</pre>` : ''}
          <p style="margin-top: 20px;"><a href="https://snap-r.com/admin/logs" style="color: #D4A017;">View Logs →</a></p>
        </div>
      `,
    });
  } catch (e) {
    console.error('[Alert] Failed to send:', e);
  }
}
