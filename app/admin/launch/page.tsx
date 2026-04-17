import { adminSupabase } from '@/lib/supabase/admin';
import { getSocialPlatformCapabilities } from '@/lib/social/capabilities';
import { Shield, AlertTriangle, MessageCircle, Share2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SocialConnectionRow {
  platform: string;
  platform_username: string | null;
  last_error: string | null;
  connected_at: string | null;
}

interface PublishFailureRow {
  id: string;
  platform: string | null;
  error_message: string | null;
  updated_at: string | null;
}

interface NotificationLogRow {
  user_email: string | null;
  notification_type: string;
  success: boolean;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default async function LaunchAdminPage() {
  const supabase = adminSupabase();
  const capabilities = getSocialPlatformCapabilities();

  const [
    { data: connections },
    { data: publishFailures },
    { data: whatsappLogs },
  ] = await Promise.all([
    supabase
      .from('social_connections')
      .select('platform, platform_username, last_error, connected_at')
      .eq('is_active', true)
      .order('connected_at', { ascending: false })
      .limit(100),
    supabase
      .from('scheduled_posts')
      .select('id, platform, error_message, updated_at')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('notification_logs')
      .select('user_email, notification_type, success, error, metadata, created_at')
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const connectionCounts = new Map<string, number>();
  for (const connection of (connections as SocialConnectionRow[] | null) ?? []) {
    connectionCounts.set(connection.platform, (connectionCounts.get(connection.platform) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#D4A017]" />
          Launch Health
        </h1>
        <p className="text-white/50 mt-1">
          Production launch diagnostics for social auth, publishing, and WhatsApp activity.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {capabilities.map((capability) => (
          <div key={capability.platform} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">{capability.name}</p>
              <span className={capability.enabled ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                {capability.enabled ? 'Enabled' : 'Blocked'}
              </span>
            </div>
            <p className="text-sm text-white/50">
              Active connections: {connectionCounts.get(capability.platform) ?? 0}
            </p>
            <p className="text-xs text-white/40 mt-2">
              {capability.launchVisible
                ? 'Visible in launch UI'
                : 'Hidden from launch UI'}
            </p>
            {!capability.enabled && capability.missing.length > 0 ? (
              <p className="text-xs text-red-300 mt-2">Missing: {capability.missing.join(', ')}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-[#D4A017]" />
            Recent Publish Failures
          </h2>
          <div className="space-y-3">
            {((publishFailures as PublishFailureRow[] | null) ?? []).length === 0 ? (
              <p className="text-sm text-white/50">No recent failed scheduled posts.</p>
            ) : (
              (publishFailures as PublishFailureRow[]).map((failure) => (
                <div key={failure.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white">{failure.platform ?? 'unknown'}</span>
                    <span className="text-xs text-white/40">
                      {failure.updated_at ? new Date(failure.updated_at).toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                  <p className="text-xs text-red-300 mt-2">{failure.error_message ?? 'Unknown error'}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-[#D4A017]" />
            WhatsApp Activity
          </h2>
          <div className="space-y-3">
            {((whatsappLogs as NotificationLogRow[] | null) ?? []).length === 0 ? (
              <p className="text-sm text-white/50">No recent WhatsApp sends or replies logged.</p>
            ) : (
              (whatsappLogs as NotificationLogRow[]).map((log, index) => (
                <div key={`${log.created_at}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white">{log.notification_type}</span>
                    <span className={log.success ? 'text-xs text-green-400' : 'text-xs text-red-400'}>
                      {log.success ? 'success' : 'failed'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    {log.user_email ?? 'No user email'} • {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.error ? <p className="text-xs text-red-300 mt-2">{log.error}</p> : null}
                  {log.metadata ? (
                    <p className="text-xs text-white/40 mt-2">
                      {JSON.stringify(log.metadata)}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mt-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#D4A017]" />
          Connection Errors
        </h2>
        <div className="space-y-3">
          {((connections as SocialConnectionRow[] | null) ?? []).filter((connection) => connection.last_error).length === 0 ? (
            <p className="text-sm text-white/50">No active connections with recorded errors.</p>
          ) : (
            ((connections as SocialConnectionRow[] | null) ?? [])
              .filter((connection) => connection.last_error)
              .map((connection, index) => (
                <div key={`${connection.platform}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-white">
                      {connection.platform} • {connection.platform_username ?? 'unknown user'}
                    </span>
                    <span className="text-xs text-white/40">
                      {connection.connected_at ? new Date(connection.connected_at).toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                  <p className="text-xs text-red-300 mt-2">{connection.last_error}</p>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}
