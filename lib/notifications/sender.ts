/**
 * SnapR Notification System - Sender Service
 */

import { 
  NotificationType, 
  NotificationPayload, 
  NotificationPreferences,
  NotificationResult,
  DEFAULT_PREFERENCES 
} from './types';
import { getTemplate, getEmailHtml } from './templates';

// Environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ================================================
// MAIN SEND FUNCTION
// ================================================

export async function sendNotification(
  payload: NotificationPayload,
  userEmail: string,
  userName: string,
  preferences: Partial<NotificationPreferences> = {}
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
    console.log(`[Notify] Skipping ${payload.type} - disabled by preferences`);
    return results;
  }

  // Check quiet hours
  if (isQuietHours(prefs)) {
    console.log(`[Notify] Skipping ${payload.type} - quiet hours active`);
    // Queue for later (could store in DB)
    return results;
  }

  // Send Email
  if (prefs.email && userEmail) {
    const emailResult = await sendEmail(userEmail, userName, payload.type, ctx);
    results.push(emailResult);
  }

  // Send WhatsApp
  if (prefs.whatsapp && prefs.whatsappNumber) {
    const whatsappResult = await sendWhatsApp(prefs.whatsappNumber, payload.type, ctx);
    results.push(whatsappResult);
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
  ctx: Record<string, any>
): Promise<NotificationResult> {
  if (!RESEND_API_KEY) {
    console.log('[Notify] Resend API key not configured');
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
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Notify] Email error:', error);
      return { channel: 'email', success: false, error };
    }

    const data = await response.json();
    console.log('[Notify] Email sent:', data.id);
    return { channel: 'email', success: true, messageId: data.id };

  } catch (error: any) {
    console.error('[Notify] Email error:', error.message);
    return { channel: 'email', success: false, error: error.message };
  }
}

// ================================================
// WHATSAPP SENDER (Twilio)
// ================================================

async function sendWhatsApp(
  phone: string,
  type: NotificationType,
  ctx: Record<string, any>
): Promise<NotificationResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('[Notify] Twilio not configured');
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
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Notify] WhatsApp error:', error);
      return { channel: 'whatsapp', success: false, error };
    }

    const data = await response.json();
    console.log('[Notify] WhatsApp sent:', data.sid);
    return { channel: 'whatsapp', success: true, messageId: data.sid };

  } catch (error: any) {
    console.error('[Notify] WhatsApp error:', error.message);
    return { channel: 'whatsapp', success: false, error: error.message };
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
      if (type === 'daily_summary') return prefs.dailyWhatsapp;
      if (type === 'weekly_report') return prefs.weeklySummary;
      return true;
    default:
      return true;
  }
}

function isQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
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

// ================================================
// BATCH NOTIFICATIONS
// ================================================

export async function sendBatchNotifications(
  payloads: Array<{
    payload: NotificationPayload;
    userEmail: string;
    userName: string;
    preferences?: Partial<NotificationPreferences>;
  }>
): Promise<Map<string, NotificationResult[]>> {
  const results = new Map<string, NotificationResult[]>();

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < payloads.length; i += batchSize) {
    const batch = payloads.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async ({ payload, userEmail, userName, preferences }) => {
        const result = await sendNotification(payload, userEmail, userName, preferences);
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
