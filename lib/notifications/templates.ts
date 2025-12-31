/**
 * SnapR Notification System - Message Templates
 */

import { NotificationType, DailySummaryData, WeeklyReportData } from './types';

interface TemplateContext {
  userName?: string;
  listingTitle?: string;
  listingAddress?: string;
  listingId?: string;
  clientName?: string;
  confidence?: number;
  photosCount?: number;
  creditsRemaining?: number;
  platform?: string;
  postLink?: string;
  tourLink?: string;
  commentPreview?: string;
  rejectedCount?: number;
  expiryDays?: number;
  dailySummary?: DailySummaryData;
  weeklyReport?: WeeklyReportData;
}

interface Template {
  subject: string;
  emailText: string;
  whatsapp: string;
  whatsappQuickReplies?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'transactional' | 'engagement' | 'social' | 'alert' | 'digest';
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com';

export function getTemplate(type: NotificationType, ctx: TemplateContext): Template {
  const templates: Record<NotificationType, Template> = {
    // ================================================
    // TRANSACTIONAL
    // ================================================
    listing_prepared: {
      subject: `✅ ${ctx.listingTitle || 'Your listing'} is ready!`,
      emailText: `Great news, ${ctx.userName}!\n\nYour listing "${ctx.listingTitle}" has been prepared by our AI engine.\n\n📊 Confidence Score: ${ctx.confidence || 0}%\n📷 Photos Processed: ${ctx.photosCount || 0}\n\nYour photos are now MLS-ready. Export them or share with your client.\n\nView listing: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `✅ *Listing Ready!*\n\n🏠 ${ctx.listingTitle}\n📊 ${ctx.confidence}% confidence\n📷 ${ctx.photosCount} photos\n\n_Reply:_\n*E* - Export for MLS\n*S* - Share with client\n*V* - View in SnapR`,
      whatsappQuickReplies: ['E', 'S', 'V'],
      priority: 'high',
      category: 'transactional',
    },

    listing_failed: {
      subject: `⚠️ Issue preparing ${ctx.listingTitle || 'your listing'}`,
      emailText: `Hi ${ctx.userName},\n\nWe encountered an issue while preparing "${ctx.listingTitle}".\n\nOur team has been notified and is looking into it. You can try again or contact support if the issue persists.\n\nRetry: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `⚠️ *Preparation Issue*\n\n🏠 ${ctx.listingTitle}\n\nWe hit a snag preparing your listing. This is usually temporary.\n\n_Reply *R* to retry_`,
      whatsappQuickReplies: ['R'],
      priority: 'high',
      category: 'transactional',
    },

    human_edit_complete: {
      subject: `🎨 Human edit complete for ${ctx.listingTitle}`,
      emailText: `Hi ${ctx.userName},\n\nA professional editor has completed work on "${ctx.listingTitle}".\n\nYour photos are ready for review and approval.\n\nReview now: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `🎨 *Human Edit Complete!*\n\n🏠 ${ctx.listingTitle}\n\nYour professional edits are ready to review.\n\n_Reply *V* to view_`,
      whatsappQuickReplies: ['V'],
      priority: 'high',
      category: 'transactional',
    },

    export_ready: {
      subject: `📦 MLS export ready for ${ctx.listingTitle}`,
      emailText: `Hi ${ctx.userName},\n\nYour MLS export package for "${ctx.listingTitle}" is ready to download.\n\nDownload: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}&action=export`,
      whatsapp: `📦 *Export Ready!*\n\n🏠 ${ctx.listingTitle}\n\nYour MLS package is ready to download.\n\n_Reply *D* to get download link_`,
      whatsappQuickReplies: ['D'],
      priority: 'medium',
      category: 'transactional',
    },

    tour_published: {
      subject: `🏠 Virtual tour live: ${ctx.listingTitle}`,
      emailText: `Hi ${ctx.userName},\n\nYour virtual tour for "${ctx.listingTitle}" is now live!\n\nView tour: ${ctx.tourLink}\n\nShare this link with clients or embed it on your website.`,
      whatsapp: `🏠 *Virtual Tour Live!*\n\n${ctx.listingTitle}\n\n🔗 ${ctx.tourLink}\n\n_Share this link with your clients!_`,
      priority: 'medium',
      category: 'transactional',
    },

    // ================================================
    // CLIENT ENGAGEMENT
    // ================================================
    client_viewed: {
      subject: `👀 ${ctx.clientName} viewed ${ctx.listingTitle}`,
      emailText: `Hi ${ctx.userName},\n\n${ctx.clientName} just viewed your gallery for "${ctx.listingTitle}".\n\nThis could be a great time to follow up!\n\nView activity: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `👀 *Client Activity!*\n\n${ctx.clientName} is viewing:\n🏠 ${ctx.listingTitle}\n\n_Hot lead - consider following up!_\n\n_Reply *C* for client contact_`,
      whatsappQuickReplies: ['C'],
      priority: 'high',
      category: 'engagement',
    },

    client_approved: {
      subject: `✅ ${ctx.clientName} approved photos for ${ctx.listingTitle}`,
      emailText: `Great news, ${ctx.userName}!\n\n${ctx.clientName} has approved all photos for "${ctx.listingTitle}".\n\nYou can now proceed with the listing!\n\nView: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `✅ *All Photos Approved!*\n\n${ctx.clientName} approved:\n🏠 ${ctx.listingTitle}\n\n🎉 _Ready to list!_\n\n_Reply *E* to export for MLS_`,
      whatsappQuickReplies: ['E'],
      priority: 'high',
      category: 'engagement',
    },

    client_rejected: {
      subject: `⚠️ ${ctx.clientName} flagged ${ctx.rejectedCount} photos`,
      emailText: `Hi ${ctx.userName},\n\n${ctx.clientName} has flagged ${ctx.rejectedCount} photo(s) for "${ctx.listingTitle}" that need attention.\n\nReview their feedback: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `⚠️ *Photos Flagged*\n\n${ctx.clientName} flagged ${ctx.rejectedCount} photo(s):\n�� ${ctx.listingTitle}\n\n_Reply *V* to review feedback_`,
      whatsappQuickReplies: ['V'],
      priority: 'high',
      category: 'engagement',
    },

    client_downloaded: {
      subject: `📥 ${ctx.clientName} downloaded photos`,
      emailText: `Hi ${ctx.userName},\n\n${ctx.clientName} just downloaded photos from "${ctx.listingTitle}".\n\nView activity: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `📥 *Download Alert*\n\n${ctx.clientName} downloaded photos from:\n�� ${ctx.listingTitle}`,
      priority: 'medium',
      category: 'engagement',
    },

    client_commented: {
      subject: `💬 ${ctx.clientName} commented on ${ctx.listingTitle}`,
      emailText: `Hi ${ctx.userName},\n\n${ctx.clientName} left a comment on "${ctx.listingTitle}":\n\n"${ctx.commentPreview}"\n\nView and respond: ${BASE_URL}/dashboard/studio?id=${ctx.listingId}`,
      whatsapp: `💬 *New Comment*\n\n${ctx.clientName} on ${ctx.listingTitle}:\n\n_"${ctx.commentPreview}"_\n\n_Reply *V* to respond_`,
      whatsappQuickReplies: ['V'],
      priority: 'high',
      category: 'engagement',
    },

    // ================================================
    // SOCIAL
    // ================================================
    post_published: {
      subject: `📱 Posted to ${ctx.platform}: ${ctx.listingTitle}`,
      emailText: `Hi ${ctx.userName},\n\nYour scheduled post for "${ctx.listingTitle}" has been published to ${ctx.platform}.\n\nView post: ${ctx.postLink}`,
      whatsapp: `📱 *Posted to ${ctx.platform}!*\n\n🏠 ${ctx.listingTitle}\n\n🔗 ${ctx.postLink}`,
      priority: 'low',
      category: 'social',
    },

    post_failed: {
      subject: `⚠️ Failed to post to ${ctx.platform}`,
      emailText: `Hi ${ctx.userName},\n\nWe couldn't publish your post to ${ctx.platform} for "${ctx.listingTitle}".\n\nThis usually means your connection has expired. Please reconnect your account.\n\nReconnect: ${BASE_URL}/dashboard/settings/social`,
      whatsapp: `⚠️ *Post Failed*\n\n${ctx.platform} post for ${ctx.listingTitle} failed.\n\n_Your connection may have expired._\n\n_Reply *R* to reconnect_`,
      whatsappQuickReplies: ['R'],
      priority: 'high',
      category: 'social',
    },

    // ================================================
    // ALERTS
    // ================================================
    credits_low: {
      subject: `⚠️ Only ${ctx.creditsRemaining} credits remaining`,
      emailText: `Hi ${ctx.userName},\n\nYou have ${ctx.creditsRemaining} credits remaining.\n\nTop up now to continue enhancing photos without interruption.\n\nUpgrade: ${BASE_URL}/billing`,
      whatsapp: `⚠️ *Low Credits*\n\nOnly ${ctx.creditsRemaining} credits left!\n\n_Reply *U* to upgrade_`,
      whatsappQuickReplies: ['U'],
      priority: 'high',
      category: 'alert',
    },

    credits_depleted: {
      subject: `🚨 No credits remaining`,
      emailText: `Hi ${ctx.userName},\n\nYou've run out of credits. Top up now to continue using SnapR.\n\nUpgrade: ${BASE_URL}/billing`,
      whatsapp: `🚨 *No Credits Left*\n\nTop up to continue enhancing.\n\n_Reply *U* to upgrade now_`,
      whatsappQuickReplies: ['U'],
      priority: 'critical',
      category: 'alert',
    },

    social_disconnected: {
      subject: `⚠️ ${ctx.platform} disconnected`,
      emailText: `Hi ${ctx.userName},\n\nYour ${ctx.platform} account has been disconnected. Scheduled posts will not be published until you reconnect.\n\nReconnect: ${BASE_URL}/dashboard/settings/social`,
      whatsapp: `⚠️ *${ctx.platform} Disconnected*\n\nYour scheduled posts won't publish.\n\n_Reply *R* to reconnect_`,
      whatsappQuickReplies: ['R'],
      priority: 'high',
      category: 'alert',
    },

    subscription_expiring: {
      subject: `Your SnapR Pro subscription expires in ${ctx.expiryDays} days`,
      emailText: `Hi ${ctx.userName},\n\nYour SnapR Pro subscription will expire in ${ctx.expiryDays} days.\n\nRenew now to keep your premium features.\n\nManage subscription: ${BASE_URL}/billing`,
      whatsapp: `⏰ *Subscription Expiring*\n\nYour Pro plan expires in ${ctx.expiryDays} days.\n\n_Reply *R* to renew_`,
      whatsappQuickReplies: ['R'],
      priority: 'medium',
      category: 'alert',
    },

    // ================================================
    // DIGESTS
    // ================================================
    daily_summary: {
      subject: `📊 Your SnapR daily summary`,
      emailText: buildDailySummaryText(ctx),
      whatsapp: buildDailySummaryWhatsApp(ctx),
      whatsappQuickReplies: ['1', '2', '3'],
      priority: 'low',
      category: 'digest',
    },

    weekly_report: {
      subject: `📈 Your weekly SnapR report`,
      emailText: buildWeeklyReportText(ctx),
      whatsapp: buildWeeklyReportWhatsApp(ctx),
      priority: 'low',
      category: 'digest',
    },
  };

  return templates[type];
}

// ================================================
// DIGEST BUILDERS
// ================================================

function buildDailySummaryText(ctx: TemplateContext): string {
  const d = ctx.dailySummary;
  if (!d) return 'No activity today.';

  let text = `Good morning, ${ctx.userName}!\n\nHere's your SnapR summary for today:\n\n`;
  
  if (d.listingsPrepared > 0) text += `✅ ${d.listingsPrepared} listing(s) prepared\n`;
  if (d.clientViews > 0) text += `👀 ${d.clientViews} client view(s)\n`;
  if (d.clientApprovals > 0) text += `✓ ${d.clientApprovals} approval(s)\n`;
  if (d.postsPublished > 0) text += `📱 ${d.postsPublished} post(s) published\n`;

  if (d.pendingActions.length > 0) {
    text += `\n⚡ Pending Actions:\n`;
    d.pendingActions.slice(0, 5).forEach(action => {
      text += `• ${action.listingTitle}: ${action.action}\n`;
    });
  }

  text += `\nView dashboard: ${BASE_URL}/dashboard`;
  return text;
}

function buildDailySummaryWhatsApp(ctx: TemplateContext): string {
  const d = ctx.dailySummary;
  if (!d) return '📊 No activity today.';

  let lines = [`☀️ *Good morning, ${ctx.userName}!*\n`];
  lines.push(`📋 *Today's SnapR Summary:*`);
  
  if (d.listingsPrepared > 0) lines.push(`• ${d.listingsPrepared} listings prepared`);
  if (d.clientViews > 0) lines.push(`• ${d.clientViews} client views`);
  if (d.clientApprovals > 0) lines.push(`• ${d.clientApprovals} approvals`);
  if (d.postsPublished > 0) lines.push(`• ${d.postsPublished} posts published`);

  if (d.pendingActions.length > 0) {
    lines.push(`\n⚡ *${d.pendingActions.length} pending action(s)*`);
  }

  lines.push(`\n_Reply:_`);
  lines.push(`*1* - View pending items`);
  lines.push(`*2* - Export ready listings`);
  lines.push(`*3* - Pause today's notifications`);

  return lines.join('\n');
}

function buildWeeklyReportText(ctx: TemplateContext): string {
  const w = ctx.weeklyReport;
  if (!w) return 'No activity this week.';

  return `Hi ${ctx.userName},\n\nHere's your weekly SnapR report:\n\n` +
    `📊 STATS\n` +
    `• ${w.totalListings} listings managed\n` +
    `• ${w.totalPhotosEnhanced} photos enhanced\n` +
    `• ${w.totalClientViews} client views\n` +
    `• ${w.totalApprovals} approvals\n` +
    `• ${w.totalExports} MLS exports\n\n` +
    `📱 SOCIAL\n` +
    `• ${w.socialStats.postsPublished} posts published\n` +
    `• ${w.socialStats.totalReach} total reach\n\n` +
    `View full report: ${BASE_URL}/dashboard`;
}

function buildWeeklyReportWhatsApp(ctx: TemplateContext): string {
  const w = ctx.weeklyReport;
  if (!w) return '📈 No activity this week.';

  return `📈 *Weekly SnapR Report*\n\n` +
    `📊 *This Week:*\n` +
    `• ${w.totalListings} listings\n` +
    `• ${w.totalPhotosEnhanced} photos enhanced\n` +
    `• ${w.totalClientViews} client views\n` +
    `• ${w.totalExports} exports\n\n` +
    `_Great work! 🎉_`;
}

// ================================================
// EMAIL HTML TEMPLATE
// ================================================

export function getEmailHtml(type: NotificationType, ctx: TemplateContext): string {
  const template = getTemplate(type, ctx);
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com';
  
  // Determine accent color based on priority
  const accentColor = {
    critical: '#ef4444',
    high: '#D4A017',
    medium: '#3b82f6',
    low: '#6b7280',
  }[template.priority];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a1a1a; border-radius: 16px; border: 1px solid ${accentColor}33; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <img src="${BASE_URL}/snapr-logo.png" alt="SnapR" style="height: 48px; margin-bottom: 16px;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="color: ${accentColor}; font-size: 24px; font-weight: 700; margin: 0 0 16px; line-height: 1.3;">
                ${template.subject}
              </h1>
              <div style="color: #cccccc; font-size: 15px; line-height: 1.6;">
                ${template.emailText.replace(/\n/g, '<br>')}
              </div>
              
              ${ctx.listingId ? `
              <a href="${BASE_URL}/dashboard/studio?id=${ctx.listingId}" 
                 style="display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #D4A017, #B8860B); color: #000; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px;">
                View in SnapR →
              </a>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} SnapR. The AI-powered real estate photo platform.
              </p>
              <p style="color: #666666; font-size: 12px; margin: 8px 0 0; text-align: center;">
                <a href="${BASE_URL}/settings" style="color: #888888;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
