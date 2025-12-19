import { createClient } from '@/lib/supabase/server';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, Code, User } from 'lucide-react';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';

async function resolveError(formData: FormData) {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const errorId = formData.get('errorId') as string;
  
  await supabase
    .from('error_logs')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', errorId);
  
  revalidatePath('/admin/logs');
}

async function resolveAll() {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  await supabase
    .from('error_logs')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('resolved', false);
  
  revalidatePath('/admin/logs');
}

export default async function AdminLogs() {
  const supabase = await createClient();

  const { data: errors } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const unresolvedCount = errors?.filter(e => !e.resolved).length || 0;
  const criticalCount = errors?.filter(e => e.severity === 'critical' && !e.resolved).length || 0;
  const todayCount = errors?.filter(e => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(e.created_at) >= today;
  }).length || 0;

  const severityColors: Record<string, string> = {
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    critical: 'bg-red-600/30 text-red-300 border-red-600/50 animate-pulse',
  };

  const typeIcons: Record<string, string> = {
    api: '🔌',
    frontend: '🖥️',
    enhancement: '✨',
    payment: '💳',
    auth: '🔐',
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Logs</h1>
          <p className="text-white/50">Monitor and resolve system errors</p>
        </div>
        <div className="flex gap-2">
          {unresolvedCount > 0 && (
            <form action={resolveAll}>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition">
                <CheckCircle className="w-4 h-4" /> Resolve All
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold">{unresolvedCount}</p>
          <p className="text-white/50 text-sm">Unresolved</p>
        </div>
        <div className={`bg-[#1A1A1A] rounded-xl p-4 ${criticalCount > 0 ? 'border-2 border-red-500/50' : 'border border-white/10'}`}>
          <XCircle className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-white/50 text-sm">Critical</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Clock className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{todayCount}</p>
          <p className="text-white/50 text-sm">Today</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-400">{(errors?.length || 0) - unresolvedCount}</p>
          <p className="text-white/50 text-sm">Resolved</p>
        </div>
      </div>

      {/* Error List */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        {errors && errors.length > 0 ? (
          <div className="divide-y divide-white/5">
            {errors.map((error: any) => (
              <div key={error.id} className={`p-5 ${!error.resolved ? 'bg-red-500/5' : ''} hover:bg-white/5 transition`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${severityColors[error.severity] || severityColors.error}`}>
                        {error.severity?.toUpperCase()}
                      </span>
                      <span className="text-sm bg-white/10 px-2 py-0.5 rounded">
                        {typeIcons[error.error_type] || '❓'} {error.error_type}
                      </span>
                      {error.resolved && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      )}
                      <span className="text-white/30 text-sm ml-auto">{timeAgo(error.created_at)}</span>
                    </div>
                    
                    {/* Error Message */}
                    <p className="text-white font-medium mb-2">{error.error_message}</p>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-white/40 mb-2">
                      {error.endpoint && (
                        <span className="flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> {error.endpoint}
                        </span>
                      )}
                      {error.error_code && (
                        <span>Code: {error.error_code}</span>
                      )}
                      {error.user_id && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {error.user_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    
                    {/* Stack Trace */}
                    {error.error_stack && (
                      <details className="mt-3">
                        <summary className="text-white/40 text-sm cursor-pointer hover:text-white/60 select-none">
                          View stack trace
                        </summary>
                        <pre className="mt-2 p-3 bg-black/60 rounded-lg text-xs text-white/60 overflow-x-auto max-h-48 overflow-y-auto">
                          {error.error_stack}
                        </pre>
                      </details>
                    )}
                    
                    {/* Request/Response Data */}
                    {(error.request_data || error.response_data) && (
                      <details className="mt-2">
                        <summary className="text-white/40 text-sm cursor-pointer hover:text-white/60 select-none">
                          View request/response data
                        </summary>
                        <div className="mt-2 space-y-2">
                          {error.request_data && (
                            <div>
                              <p className="text-xs text-white/50 mb-1">Request:</p>
                              <pre className="p-2 bg-black/60 rounded text-xs text-white/60 overflow-x-auto">
                                {JSON.stringify(error.request_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {error.response_data && (
                            <div>
                              <p className="text-xs text-white/50 mb-1">Response:</p>
                              <pre className="p-2 bg-black/60 rounded text-xs text-white/60 overflow-x-auto">
                                {JSON.stringify(error.response_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                    
                    {/* Timestamp */}
                    <p className="text-white/20 text-xs mt-3">
                      {new Date(error.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  {!error.resolved && (
                    <form action={resolveError} className="flex-shrink-0">
                      <input type="hidden" name="errorId" value={error.id} />
                      <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white font-medium mb-1">All Clear!</p>
            <p className="text-white/50">No errors logged yet</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {errors && errors.length > 0 && (
        <div className="mt-6 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-sm text-white/50">
          Showing {errors.length} most recent errors • {unresolvedCount} need attention
        </div>
      )}
    </div>
  );
}
