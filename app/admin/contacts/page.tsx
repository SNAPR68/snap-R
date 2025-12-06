import { createClient } from '@/lib/supabase/server';
import { Mail, Clock, CheckCircle, MessageSquare, User, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminContacts() {
  const supabase = await createClient();

  // Get all submissions
  const { data: submissions } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  // Calculate stats
  const total = submissions?.length || 0;
  const newCount = submissions?.filter(s => s.status === 'new' || !s.status).length || 0;
  const repliedCount = submissions?.filter(s => s.status === 'replied').length || 0;
  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;

  // Last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = submissions?.filter(s => new Date(s.created_at) >= sevenDaysAgo).length || 0;

  // Time ago helper
  const timeAgo = (date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Status config
  const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    new: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: AlertCircle },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
    replied: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <p className="text-white/50">Manage inquiries from the contact form</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <MessageSquare className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-white/50 text-xs">Total</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-blue-400">{newCount}</p>
          <p className="text-white/50 text-xs">New</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Clock className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          <p className="text-white/50 text-xs">Pending</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-400">{repliedCount}</p>
          <p className="text-white/50 text-xs">Replied</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Calendar className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-2xl font-bold">{recentCount}</p>
          <p className="text-white/50 text-xs">This Week</p>
        </div>
      </div>

      {/* Urgent notice if there are new unread */}
      {newCount > 0 && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <p className="text-blue-400">
            You have <span className="font-bold">{newCount}</span> new unread message{newCount > 1 ? 's' : ''} that need attention
          </p>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        {submissions && submissions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {submissions.map((sub) => {
              const status = sub.status || 'new';
              const config = statusConfig[status] || statusConfig.new;
              const StatusIcon = config.icon;
              
              return (
                <div key={sub.id} className={`p-6 hover:bg-white/5 transition-colors ${status === 'new' ? 'bg-blue-500/5' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: User Info & Message */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-semibold">
                          {(sub.name || sub.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-white">{sub.name || 'Anonymous'}</p>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>
                          <a href={`mailto:${sub.email}`} className="text-[#D4A017] text-sm hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {sub.email}
                          </a>
                        </div>
                      </div>

                      {/* Subject */}
                      {sub.subject && (
                        <p className="text-white/80 font-medium mb-2">
                          Subject: {sub.subject}
                        </p>
                      )}

                      {/* Message */}
                      <div className="p-4 bg-black/20 rounded-lg mb-3">
                        <p className="text-white/70 text-sm whitespace-pre-wrap">
                          {sub.message}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(sub.created_at)}
                        </span>
                        <span>
                          {new Date(sub.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {sub.phone && (
                          <span className="flex items-center gap-1">
                            📞 {sub.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex lg:flex-col gap-2">
                      <a
                        href={`mailto:${sub.email}?subject=Re: ${sub.subject || 'Your SnapR Inquiry'}&body=%0A%0A---%0AOriginal message:%0A${encodeURIComponent(sub.message || '')}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Mail className="w-4 h-4" />
                        Reply
                      </a>
                      {status === 'new' && (
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-colors text-sm">
                          <Clock className="w-4 h-4" />
                          Mark Pending
                        </button>
                      )}
                      {status !== 'replied' && (
                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Mark Replied
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#D4A017]/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#D4A017]" />
            </div>
            <p className="text-white font-medium">No contact submissions yet</p>
            <p className="text-white/40 text-sm mt-1">Submissions from your contact form will appear here</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="mt-6 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl">
          <p className="text-white/50 text-sm">
            Showing {total} submission{total > 1 ? 's' : ''} • 
            Response rate: {total > 0 ? ((repliedCount / total) * 100).toFixed(0) : 0}%
          </p>
        </div>
      )}

      {/* Note about status updates */}
      <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-white/40 text-sm">
          <span className="text-[#D4A017] font-medium">Note:</span> Status buttons are UI-only for now. 
          To enable status updates, add a server action to update the <code className="text-white/60 bg-white/10 px-1 rounded">contact_submissions</code> table.
        </p>
      </div>
    </div>
  );
}