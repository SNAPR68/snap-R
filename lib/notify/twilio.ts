/**
 * Twilio REST API helpers — no SDK, uses fetch + Basic auth
 * Supports SMS and WhatsApp (via Twilio sandbox / approved number)
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

function basicAuth() {
  return Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')
}

export interface TwilioResult {
  success: boolean
  sid?: string
  error?: string
}

async function sendMessage(to: string, from: string, body: string): Promise<TwilioResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`
  const params = new URLSearchParams({ To: to, From: from, Body: body })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(15000),
  })

  const data = await res.json() as { sid?: string; error_message?: string; message?: string }
  if (!res.ok) {
    return { success: false, error: data.error_message ?? data.message ?? 'Twilio error' }
  }
  return { success: true, sid: data.sid }
}

/**
 * Send an SMS to a phone number.
 * `from` should be your Twilio phone number (e.g. +15005550006 for test)
 */
export async function sendSms(to: string, body: string, fromNumber?: string): Promise<TwilioResult> {
  const from = fromNumber ?? process.env.TWILIO_SMS_FROM ?? ''
  if (!from) return { success: false, error: 'TWILIO_SMS_FROM not configured' }
  return sendMessage(to, from, body)
}

/**
 * Send a WhatsApp message via Twilio sandbox or approved number.
 * `to` must be formatted as "whatsapp:+1XXXXXXXXXX"
 */
export async function sendWhatsApp(to: string, body: string): Promise<TwilioResult> {
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  return sendMessage(toFormatted, WHATSAPP_FROM, body)
}
