import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    console.warn('[CostLogger] Missing env vars:', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
    });
    return null;
  }
  
  return createClient(url, serviceKey);
};

// Cost estimates per provider (in cents per API call)
export const COST_ESTIMATES: Record<string, Record<string, number>> = {
  replicate: {
    'sky-replacement': 5,
    'virtual-twilight': 6,
    'lawn-repair': 4,
    'declutter': 5,
    'virtual-staging': 8,
    'fire-fireplace': 4,
    'tv-screen': 4,
    'lights-on': 4,
    'window-masking': 5,
    'color-balance': 3,
    'pool-enhance': 4,
    'hdr': 3,
    'auto-enhance': 3,
    'perspective-correction': 3,
    'lens-correction': 3,
    'default': 5,
  },
  runware: {
    'inpainting': 2,
    'upscale': 1,
    'default': 2,
  },
  openai: {
    'vision-analysis': 2,
    'quality-scoring': 2,
    'default': 2,
  },
  autoenhance: {
    'auto-enhance': 4,
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
    if (!supabase) {
      console.error('[CostLogger] No Supabase client - check SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    const insertData = {
      user_id: userId || null,
      provider,
      model: provider,
      tool_id: toolId || null,
      cost_cents: success ? costCents : 0,
      success,
      error_message: errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('api_costs').insert(insertData);

    if (error) {
      console.error('[CostLogger] Insert failed:', error.message);
      console.error('[CostLogger] Data:', insertData);
    } else {
      console.log(`[CostLogger] ✓ ${provider}/${toolId}: ${costCents}¢ (${success ? 'success' : 'failed'})`);
    }
  } catch (e: any) {
    console.error('[CostLogger] Exception:', e.message);
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
    if (!supabase) {
      console.error('[SystemLog] No Supabase client');
      return;
    }

    const { error } = await supabase.from('system_logs').insert({
      level,
      source,
      message,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[SystemLog] Insert failed:', error.message);
    }

    if (level === 'critical') {
      await sendCriticalAlert(source, message, metadata);
    }
  } catch (e: any) {
    console.error('[SystemLog] Exception:', e.message);
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