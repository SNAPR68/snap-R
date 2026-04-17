/**
 * SnapR Notification System - Sender Service
 *
 * Sends notifications via Email (Resend), WhatsApp (Twilio), and
 * persists an in-app notification record for the bell icon dropdown.
 */

import {
  NotificationType,
  NotificationPayload,
  NotificationPreferences,
  NotificationResult,
  DEFAULT_PREFERENCES
} from './types';
import { getTemplate, getEmailHtml } from './templates';
import { getNotificationTimezone } from './preferences';

import { logger } from '@/lib/logger';
// Environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface NotificationDeliveryOptions {
  bypassQuietHours?: boolean;
}

// ================================================
// NOTIFICATION LOGGER
// ================================================

async function logNotification(
  userId: string | undefined,
  userEmail: string,
  type: string,
  channel: 'email' | 'whatsapp',
  success: boolean,
  messageId?: string,
  error?: string
): Promise<void> {
  try {
    const { adminSupabase } = await import('@/lib/supabase/admin');
    await adminSupabase().from('notification_logs').insert({
      user_id: userId || null,
      user_email: userEmail,
      notification_type: type,
      channel,
      success,
      message_id: messageId || null,
      error: error || null,
    });
  } catch {
    logger.error('[Notify] Failed to log notification');
  }
}

// ================================================
// IN-APP NOTIFICATION WRITER
// ================================================

async function writeInAppNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  try {
    const { adminSupabase } = await import('@/lib/supabase/admin');
    await adminSupabase().from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      link: link || null,
    });
  } catch {
    logger.error('[Notify] Failed to write in-app notification');
  }
}

/**
 * Build a deep link for a notification type.
 */
function getNotificationLink(payload: NotificationPayload): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com';
  if (payload.listingId) {
    return `${base}/dashboard/studio?id=${payload.listingId}`;
  }
  switch (payload.type) {
    case 'credits_low':
    case 'credits_depleted':
      return `${base}/dashboard/billing`;
    case 'social_disconnected':
      return `${base}/dashboard/settings/social`;
    case 'daily_summary':
    case 'weekly_report':
      return `${base}/dashboard`;
    default:
      return undefined;
  }
}

// ================================================
// MAIN SEND FUNCTION
// ================================================

export async function sendNotification(
  payload: NotificationPayload,
  userEmail: string,
  userName: string,
  preferences: Partial<NotificationPreferences> = {},
  options: NotificationDeliveryOptions = {}
): Promise<NotificationResult[]> {
  const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
  const results: NotificationResult[] = [];

  // Build template context
  const ctx = {
    userName,
    ...payload.data,
  };

  const template = getTemplate(payload.type, ctx);

  // Check if notification should be sent based on preferences
  if (!shouldSendNotification(payload.type, template.category, prefs)) {
    logger.info(`[Notify] Skipping ${payload.type} - disabled by preferences`);
    return results;
  }

  // Check quiet hours
  if (!options.bypassQuietHours && isQuietHours(prefs)) {
    logger.info(`[Notify] Skipping ${payload.type} - quiet hours active`);
    // Queue for later (could store in DB)
    return results;
  }

  // Always write an in-app notification (fire-and-forget)
  if (payload.userId) {
    const link = getNotificationLink(payload);
    writeInAppNotification(
      payload.userId,
      payload.type,
      template.subject,
      template.emailText.slice(0, 300),
      link
    ).catch(() => {});
  }

  // Send Email
  if (prefs.email && userEmail) {
    const emailResult = await sendEmail(userEmail, userName, payload.type, ctx);
    results.push(emailResult);
    // Log to DB (fire-and-forget)
    logNotification(payload.userId, userEmail, payload.type, 'email', emailResult.success, emailResult.messageId, emailResult.error).catch(() => {});
  }

  // Send WhatsApp
  if (prefs.whatsapp && prefs.whatsappNumber) {
    const whatsappResult = await sendWhatsApp(prefs.whatsappNumber, payload.type, ctx);
    results.push(whatsappResult);
    // Log to DB (fire-and-forget)
    logNotification(payload.userId, userEmail, payload.type, 'whatsapp', whatsappResult.success, whatsappResult.messageId, whatsappResult.error).catch(() => {});
  }

  return results;
}

// ================================================
// EMAIL SENDER (Resend)
// ================================================

async function sendEmail(
  to: string,
  name: string,
  type: NotificationType,
  ctx: Record<string, unknown>
): Promise<NotificationResult> {
  if (!RESEND_API_KEY) {
    logger.info('[Notify] Resend API key not configured');
    return { channel: 'email', success: false, error: 'Not configured' };
  }

  const template = getTemplate(type, { userName: name, ...ctx });
  const html = getEmailHtml(type, { userName: name, ...ctx });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SnapR <notifications@snap-r.com>',
        to: [to],
        subject: template.subject,
        html,
        text: template.emailText,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('[Notify] Email error:', errText);
      return { channel: 'email', success: false, error: errText };
    }

    const data = await response.json();
    logger.info('[Notify] Email sent:', data.id);
    return { channel: 'email', success: true, messageId: data.id };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Notify] Email error:', msg);
    return { channel: 'email', success: false, error: msg };
  }
}

// ================================================
// WHATSAPP SENDER (Twilio)
// ================================================

async function sendWhatsApp(
  phone: string,
  type: NotificationType,
  ctx: Record<string, unknown>
): Promise<NotificationResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    logger.info('[Notify] Twilio not configured');
    return { channel: 'whatsapp', success: false, error: 'Not configured' };
  }

  const template = getTemplate(type, ctx);

  // Format phone for WhatsApp
  let formattedPhone = phone.replace(/[^0-9+]/g, '');
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+1' + formattedPhone;
  }
  formattedPhone = 'whatsapp:' + formattedPhone;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: formattedPhone,
          Body: template.whatsapp,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      logger.error('[Notify] WhatsApp error:', errText);
      return { channel: 'whatsapp', success: false, error: errText };
    }

    const data = await response.json();
    logger.info('[Notify] WhatsApp sent:', data.sid);
    return { channel: 'whatsapp', success: true, messageId: data.sid };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Notify] WhatsApp error:', msg);
    return { channel: 'whatsapp', success: false, error: msg };
  }
}

// ================================================
// HELPER FUNCTIONS
// ================================================

function shouldSendNotification(
  type: NotificationType,
  category: string,
  prefs: NotificationPreferences
): boolean {
  // Critical alerts always sent
  if (type === 'credits_depleted') return true;

  // Check category preferences
  switch (category) {
    case 'transactional':
      return prefs.transactional !== 'none';
    case 'engagement':
      return prefs.clientEngagement !== 'none';
    case 'social':
      return prefs.socialUpdates !== 'none';
    case 'alert':
      return true; // alerts always sent (all or critical)
    case 'digest':
      if (type === 'daily_summary') return prefs.dailyWhatsapp || prefs.dailyEmail !== false;
      if (type === 'weekly_report') return prefs.weeklySummary;
      return true;
    default:
      return true;
  }
}

function isQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const now = new Date();
  const { hour: currentHour, minute: currentMinute } = getTimeInTimezone(
    now,
    getNotificationTimezone(prefs)
  );
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = prefs.quietHoursStart.split(':').map(Number);
  const [endHour, endMinute] = prefs.quietHoursEnd.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
}

function getTimeInTimezone(date: Date, timeZone: string): { hour: number; minute: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

    return { hour, minute };
  } catch {
    return { hour: date.getUTCHours(), minute: date.getUTCMinutes() };
  }
}

// ================================================
// BATCH NOTIFICATIONS
// ================================================

export async function sendBatchNotifications(
  payloads: Array<{
    payload: NotificationPayload;
    userEmail: string;
    userName: string;
    preferences?: Partial<NotificationPreferences>;
    options?: NotificationDeliveryOptions;
  }>
): Promise<Map<string, NotificationResult[]>> {
  const results = new Map<string, NotificationResult[]>();

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < payloads.length; i += batchSize) {
    const batch = payloads.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async ({ payload, userEmail, userName, preferences, options }) => {
        const result = await sendNotification(payload, userEmail, userName, preferences, options);
        results.set(payload.userId, result);
      })
    );

    // Small delay between batches
    if (i + batchSize < payloads.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ================================================
// CONVENIENCE FUNCTIONS
// ================================================

export async function notifyListingPrepared(
  userId: string,
  userEmail: string,
  userName: string,
  listingId: string,
  listingTitle: string,
  confidence: number,
  photosCount: number,
  preferences?: Partial<NotificationPreferences>
) {
  return sendNotification(
    {
      type: 'listing_prepared',
      userId,
      listingId,
      data: { listingId, listingTitle, confidence, photosCount },
    },
    userEmail,
    userName,
    preferences
  );
}

export async function notifyClientViewed(
  userId: string,
  userEmail: string,
  userName: string,
  listingId: string,
  listingTitle: string,
  clientName: string,
  preferences?: Partial<NotificationPreferences>
) {
  return sendNotification(
    {
      type: 'client_viewed',
      userId,
      listingId,
      clientName,
      data: { listingId, listingTitle, clientName },
    },
    userEmail,
    userName,
    preferences
  );
}

export async function notifyClientApproved(
  userId: string,
  userEmail: string,
  userName: string,
  listingId: string,
  listingTitle: string,
  clientName: string,
  preferences?: Partial<NotificationPreferences>
) {
  return sendNotification(
    {
      type: 'client_approved',
      userId,
      listingId,
      clientName,
      data: { listingId, listingTitle, clientName },
    },
    userEmail,
    userName,
    preferences
  );
}

export async function notifyCreditsLow(
  userId: string,
  userEmail: string,
  userName: string,
  creditsRemaining: number,
  preferences?: Partial<NotificationPreferences>
) {
  return sendNotification(
    {
      type: 'credits_low',
      userId,
      data: { creditsRemaining },
    },
    userEmail,
    userName,
    preferences
  );
}
