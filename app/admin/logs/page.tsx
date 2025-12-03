import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';

export default async function AdminLogs() {
  const supabase = await createClient();

  // Get recent logs
  const { data: logs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // Get API costs with errors
  const { data: apiErrors } = await supabase
    .from('api_costs')
    .select('*')
    .eq('success', false)
    .order('created_at', { ascending: false })
    .limit(50);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">System Logs</h1>
      <p className="text-white/50 mb-8">Monitor errors and system events</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Logs */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {logs?.map((log) => (
              <div key={log.id} className={`p-3 rounded-lg text-sm ${log.level === 'error' ? 'bg-red-500/10 border border-red-500/30' : log.level === 'warn' ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-white/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {getLevelIcon(log.level)}
                  <span className="font-medium">{log.source}</span>
                  <span className="text-white/40 text-xs ml-auto">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-white/70">{log.message}</p>
              </div>
            ))}
            {!logs?.length && (
              <p className="text-white/50 text-center py-8">No logs yet</p>
            )}
          </div>
        </div>

        {/* API Errors */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">API Failures</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {apiErrors?.map((error) => (
              <div key={error.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="font-medium capitalize">{error.provider}</span>
                  <span className="text-white/40 px-2 py-0.5 bg-white/10 rounded text-xs">{error.tool_id}</span>
                  <span className="text-white/40 text-xs ml-auto">
                    {new Date(error.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-red-300">{error.error_message || 'Unknown error'}</p>
              </div>
            ))}
            {!apiErrors?.length && (
              <div className="flex flex-col items-center py-8 text-green-400">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p>No API failures</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
