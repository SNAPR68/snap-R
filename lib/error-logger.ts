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

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export async function logEvent({
  level,
  source,
  message,
  userId,
  metadata,
  stack,
}: LogEntry) {
  // Always console log
  const logFn = level === 'error' || level === 'critical' ? console.error : console.log;
  logFn(`[${level.toUpperCase()}] [${source}] ${message}`, metadata || '');

  // Save to database
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.from('system_logs').insert({
      level,
      source,
      message,
      metadata: {
        ...metadata,
        userId,
        stack,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
    });

    // Send alert for critical errors
    if (level === 'critical') {
      await sendAlertEmail(source, message, metadata);
    }
  } catch (e) {
    console.error('[ErrorLogger] Failed to log:', e);
  }
}

export async function logError(
  source: string,
  error: Error | unknown,
  metadata?: Record<string, any>
) {
  const err = error instanceof Error ? error : new Error(String(error));
  await logEvent({
    level: 'error',
    source,
    message: err.message,
    stack: err.stack,
    metadata,
  });
}

export async function logCritical(
  source: string,
  message: string,
  metadata?: Record<string, any>
) {
  await logEvent({
    level: 'critical',
    source,
    message,
    metadata,
  });
}

async function sendAlertEmail(source: string, message: string, metadata?: any) {
  try {
    const { Resend } = await import('resend');
    if (!process.env.RESEND_API_KEY) return;

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SnapR Alerts <notifications@snap-r.com>',
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
