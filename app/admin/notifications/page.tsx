import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  MessageCircle,
  Mail,
  Bell,
  Users,
  CheckCircle,
  XCircle,
  Send,
  PauseCircle,
  Phone,
  Shield,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Server action: Send test notification
async function sendTestNotification(formData: FormData) {
  'use server';
  const email = formData.get('email') as string;
  if (!email) return;

  try {
    const { sendNotification } = await import('@/lib/notifications/sender');
    await sendNotification(
      {
        type: 'listing_prepared',
        userId: 'admin-test',
        data: {
          listingId: 'test-123',
          listingTitle: 'Test Property - Admin Panel',
          confidence: 95,
          photosCount: 10,
        },
      },
      email,
      'Admin Test',
      { email: true, whatsapp: false },
      { bypassQuietHours: true }
    );
  } catch (err) {
    console.error('[Admin] Test notification error:', err);
  }

  revalidatePath('/admin/notifications');
}

// Server action: Pause user notifications
async function pauseUserNotifications(formData: FormData) {
  'use server';
  const { adminSupabase } = await import('@/lib/supabase/admin');
  const userId = formData.get('userId') as string;
  const action = formData.get('action') as string;

  if (!userId) return;

  if (action === 'pause') {
    // Pause for 7 days
    const pauseUntil = new Date();
    pauseUntil.setDate(pauseUntil.getDate() + 7);
    await adminSupabase()
      .from('profiles')
      .update({ notifications_paused_until: pauseUntil.toISOString() })
      .eq('id', userId);
  } else {
    // Resume
    await adminSupabase()
      .from('profiles')
      .update({ notifications_paused_until: null })
      .eq('id', userId);
  }

  revalidatePath('/admin/notifications');
}

export default async function AdminNotificationsPage() {
  const supabase = adminSupabase();

  // Fetch notification logs (last 50)
  const { data: logs } = await supabase
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const recentLogs = logs || [];

  // Count totals
  const totalLogs = recentLogs.length;
  const emailLogs24h = recentLogs.filter(
    (l) =>
      l.channel === 'email' &&
      new Date(l.created_at) > new Date(Date.now() - 86400000)
  ).length;
  const whatsappLogs24h = recentLogs.filter(
    (l) =>
      l.channel === 'whatsapp' &&
      new Date(l.created_at) > new Date(Date.now() - 86400000)
  ).length;

  // Fetch profiles with phone numbers (WhatsApp users)
  const { data: whatsappProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, notification_preferences, notifications_paused_until')
    .not('phone', 'is', null)
    .order('created_at', { ascending: false });

  const whatsappUsers = whatsappProfiles || [];

  // Count users with WhatsApp enabled in preferences
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('notification_preferences');

  const whatsappEnabledCount = (allProfiles || []).filter((p) => {
    const prefs = p.notification_preferences as Record<string, unknown> | null;
    return prefs && prefs.whatsapp === true;
  }).length;

  // Env var status
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasResend = !!process.env.RESEND_API_KEY;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-[#D4A017]" />
          Notifications Admin
        </h1>
        <p className="text-white/50 mt-1">
          Monitor and manage email & WhatsApp notifications
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Bell className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{totalLogs}</p>
          <p className="text-white/50 text-xs">Total Logged (last 50)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-green-500/30 rounded-xl p-4">
          <Users className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-400">{whatsappEnabledCount}</p>
          <p className="text-white/50 text-xs">WhatsApp Enabled Users</p>
        </div>
        <div className="bg-[#1A1A1A] border border-blue-500/30 rounded-xl p-4">
          <Mail className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-blue-400">{emailLogs24h}</p>
          <p className="text-white/50 text-xs">Emails (24h)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-emerald-500/30 rounded-xl p-4">
          <MessageCircle className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{whatsappLogs24h}</p>
          <p className="text-white/50 text-xs">WhatsApp (24h)</p>
        </div>
      </div>

      {/* Config Status + Send Test */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Config Status */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D4A017]" />
            Service Configuration
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-white/50" />
                <span className="text-sm">Twilio WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                {hasTwilio ? (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <XCircle className="w-3.5 h-3.5" /> Not configured
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/50" />
                <span className="text-sm">Resend Email</span>
              </div>
              <div className="flex items-center gap-2">
                {hasResend ? (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <XCircle className="w-3.5 h-3.5" /> Not configured
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/50" />
                <span className="text-sm">WhatsApp From</span>
              </div>
              <code className="text-xs text-[#D4A017] bg-[#D4A017]/10 px-2 py-1 rounded">
                {twilioFrom}
              </code>
            </div>
          </div>
        </div>

        {/* Send Test */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#D4A017]" />
            Send Test Notification
          </h2>
          <form action={sendTestNotification} className="space-y-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="test@example.com"
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017]/50"
              />
            </div>
            <p className="text-white/40 text-xs">
              Sends a test &quot;Listing Prepared&quot; email notification. Check the logs table below after sending.
            </p>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#D4A017] text-black rounded-lg text-sm font-medium hover:bg-[#B8860B] transition"
            >
              Send Test Email
            </button>
          </form>
        </div>
      </div>

      {/* WhatsApp Users Table */}
      {whatsappUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#D4A017]" />
            Users with Phone Numbers ({whatsappUsers.length})
          </h2>
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">User</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Phone</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">WhatsApp</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Paused Until</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {whatsappUsers.map((user) => {
                    const prefs = (user.notification_preferences || {}) as Record<string, unknown>;
                    const isWhatsAppOn = prefs.whatsapp === true;
                    const isPaused =
                      user.notifications_paused_until &&
                      new Date(user.notifications_paused_until) > new Date();

                    return (
                      <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <p className="font-medium text-sm">{user.full_name || 'Unknown'}</p>
                          <p className="text-white/40 text-xs">{user.email}</p>
                        </td>
                        <td className="p-4">
                          <code className="text-xs bg-white/10 px-2 py-1 rounded">
                            {user.phone}
                          </code>
                        </td>
                        <td className="p-4">
                          {isWhatsAppOn ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                              Enabled
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/40">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isPaused ? (
                            <span className="text-xs text-yellow-400">
                              {new Date(user.notifications_paused_until).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">Active</span>
                          )}
                        </td>
                        <td className="p-4">
                          <form action={pauseUserNotifications}>
                            <input type="hidden" name="userId" value={user.id} />
                            {isPaused ? (
                              <>
                                <input type="hidden" name="action" value="resume" />
                                <button className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition">
                                  Resume
                                </button>
                              </>
                            ) : (
                              <>
                                <input type="hidden" name="action" value="pause" />
                                <button className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition">
                                  <PauseCircle className="w-3 h-3" /> Pause 7d
                                </button>
                              </>
                            )}
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Notification Logs */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#D4A017]" />
          Recent Notification Logs
        </h2>

        {recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[#1A1A1A] border border-white/10 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-[#D4A017]/20 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#D4A017]" />
            </div>
            <p className="text-white font-medium">No notification logs yet</p>
            <p className="text-white/40 text-sm mt-1">
              Logs will appear here once notifications are sent
            </p>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Time</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Recipient</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Type</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Channel</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                    <th className="text-left p-4 text-white/60 font-medium text-sm">Message ID</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <span className="text-xs text-white/50">
                          {new Date(log.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white/70">{log.user_email || '-'}</span>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-white/10 px-2 py-1 rounded">
                          {log.notification_type}
                        </code>
                      </td>
                      <td className="p-4">
                        {log.channel === 'whatsapp' ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-blue-400">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {log.success ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                            Sent
                          </span>
                        ) : (
                          <span
                            className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400"
                            title={log.error || undefined}
                          >
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-white/30 font-mono">
                          {log.message_id ? log.message_id.slice(0, 16) + '...' : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
