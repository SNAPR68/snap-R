/**
 * SnapR Notification System - Types
 */

export type NotificationChannel = 'email' | 'whatsapp' | 'push';

export type NotificationType = 
  // Transactional
  | 'listing_prepared'
  | 'listing_failed'
  | 'human_edit_complete'
  | 'export_ready'
  | 'tour_published'
  // Client Engagement
  | 'client_viewed'
  | 'client_approved'
  | 'client_rejected'
  | 'client_downloaded'
  | 'client_commented'
  // Social
  | 'post_published'
  | 'post_failed'
  // Alerts
  | 'credits_low'
  | 'credits_depleted'
  | 'social_disconnected'
  | 'subscription_expiring'
  // Digests
  | 'daily_summary'
  | 'weekly_report';

export interface NotificationPayload {
  type: NotificationType;
  userId: string;
  listingId?: string;
  clientName?: string;
  data: Record<string, any>;
}

export interface NotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  whatsappNumber?: string;
  
  // Category settings
  transactional: 'all' | 'important' | 'none';
  clientEngagement: 'all' | 'important' | 'none';
  socialUpdates: 'all' | 'summary' | 'none';
  alerts: 'all' | 'critical';
  
  // Digest settings
  dailyWhatsapp: boolean;
  dailyWhatsappTime: string;
  weeklySummary: boolean;
  weeklyDay: 'monday' | 'friday' | 'sunday';
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  whatsapp: false,
  transactional: 'all',
  clientEngagement: 'all',
  socialUpdates: 'summary',
  alerts: 'all',
  dailyWhatsapp: false,
  dailyWhatsappTime: '08:00',
  weeklySummary: true,
  weeklyDay: 'monday',
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DailySummaryData {
  listingsPrepared: number;
  clientViews: number;
  clientApprovals: number;
  postsPublished: number;
  pendingActions: Array<{
    type: string;
    listingId: string;
    listingTitle: string;
    action: string;
  }>;
}

export interface WeeklyReportData {
  totalListings: number;
  totalPhotosEnhanced: number;
  totalClientViews: number;
  totalApprovals: number;
  totalExports: number;
  socialStats: {
    postsPublished: number;
    totalReach: number;
    engagement: number;
  };
  topListings: Array<{
    id: string;
    title: string;
    views: number;
    exports: number;
  }>;
}
