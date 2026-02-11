/**
 * SnapR API - WhatsApp Webhook
 * =============================
 * Handles incoming WhatsApp messages (quick replies)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const from = formData.get('From')?.toString() || '';
    const body = formData.get('Body')?.toString().trim().toUpperCase() || '';
    
    console.log('[WhatsApp Webhook] From:', from, 'Body:', body);
    
    const phone = from.replace('whatsapp:', '');
    
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone', phone)
      .single();
    
    if (!profile) {
      return respondWithMessage('Sorry, I couldn\'t find your account. Please register your phone in SnapR settings.');
    }
    
    const response = await handleQuickReply(body, profile.id, supabase);
    return respondWithMessage(response);
    
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error.message);
    return respondWithMessage('Sorry, something went wrong. Please try again.');
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

async function handleQuickReply(command: string, userId: string, supabase: any): Promise<string> {
  switch (command) {
    case 'E':
      return await handleExportCommand(userId, supabase);
    case 'S':
      return await handleShareCommand(userId, supabase);
    case 'V':
      return await handleViewCommand(userId, supabase);
    case 'R':
      return `🔄 *Retry/Reconnect*\n\nVisit: https://snap-r.com/dashboard`;
    case '1':
      return await handlePendingCommand(userId, supabase);
    case '2':
      return await handleExportAllCommand(userId, supabase);
    case '3':
      return await handlePauseCommand(userId, supabase);
    case 'C':
      return `👤 View client info: https://snap-r.com/dashboard/clients`;
    case 'D':
      return await handleExportCommand(userId, supabase);
    case 'U':
      return `🚀 *Upgrade Your Plan*\n\nVisit: https://snap-r.com/billing`;
    case 'HELP':
    case '?':
      return getHelpMessage();
    case 'STOP':
      return await handleStopCommand(userId, supabase);
    case 'RESUME':
      return await handleResumeCommand(userId, supabase);
    default:
      return `I didn't understand that.\n\nReply *HELP* for commands.`;
  }
}

async function handleExportCommand(userId: string, supabase: any): Promise<string> {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, address')
    .eq('user_id', userId)
    .eq('preparation_status', 'prepared')
    .order('prepared_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!listing) return `📦 No listings ready for export.`;
  
  const title = listing.title || listing.address || 'Your listing';
  return `📦 *Export ${title}*\n\nDownload: https://snap-r.com/dashboard/studio?id=${listing.id}&action=export`;
}

async function handleShareCommand(userId: string, supabase: any): Promise<string> {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, address')
    .eq('user_id', userId)
    .eq('preparation_status', 'prepared')
    .order('prepared_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!listing) return `🔗 No listings ready to share.`;
  
  const title = listing.title || listing.address || 'Your listing';
  return `🔗 *Share ${title}*\n\nGet link: https://snap-r.com/dashboard/studio?id=${listing.id}&action=share`;
}

async function handleViewCommand(userId: string, supabase: any): Promise<string> {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, address')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!listing) return `🏠 No listings yet. Create one: https://snap-r.com/listings/new`;
  
  const title = listing.title || listing.address || 'Your listing';
  return `🏠 *${title}*\n\nView: https://snap-r.com/dashboard/studio?id=${listing.id}`;
}

async function handlePendingCommand(userId: string, supabase: any): Promise<string> {
  const { data: needsReview } = await supabase
    .from('listings')
    .select('title, address')
    .eq('user_id', userId)
    .eq('preparation_status', 'needs_review')
    .limit(5);
  
  let message = `⚡ *Pending Items*\n\n`;
  
  if (needsReview?.length) {
    message += `*Needs Review:*\n`;
    needsReview.forEach((l: any) => { message += `• ${l.title || l.address}\n`; });
  } else {
    message += `✅ All caught up!`;
  }
  
  return message;
}

async function handleExportAllCommand(userId: string, supabase: any): Promise<string> {
  const { data: listings } = await supabase
    .from('listings')
    .select('title, address')
    .eq('user_id', userId)
    .eq('preparation_status', 'prepared')
    .limit(10);
  
  if (!listings?.length) return `📦 No listings ready for export.`;
  
  let message = `📦 *Ready for Export:*\n\n`;
  listings.forEach((l: any) => { message += `• ${l.title || l.address}\n`; });
  message += `\nExport: https://snap-r.com/dashboard`;
  
  return message;
}

async function handlePauseCommand(userId: string, supabase: any): Promise<string> {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  await supabase.from('profiles').update({ notifications_paused_until: endOfDay.toISOString() }).eq('id', userId);
  
  return `🔕 Notifications paused until tomorrow.\n\nReply *RESUME* to re-enable.`;
}

async function handleStopCommand(userId: string, supabase: any): Promise<string> {
  await supabase.from('profiles').update({ 'notification_preferences': { whatsapp: false } }).eq('id', userId);
  return `🛑 WhatsApp disabled.\n\nRe-enable: https://snap-r.com/settings`;
}

async function handleResumeCommand(userId: string, supabase: any): Promise<string> {
  await supabase.from('profiles').update({ notifications_paused_until: null }).eq('id', userId);
  return `✅ Notifications resumed!`;
}

function getHelpMessage(): string {
  return `📖 *SnapR Commands*\n
*E* - Export for MLS
*S* - Share with client
*V* - View listing
*1* - Pending items
*2* - Export all ready
*3* - Pause today
*U* - Upgrade plan
*STOP* - Disable WhatsApp
*RESUME* - Re-enable`;
}

function respondWithMessage(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message></Response>`;
  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
}
