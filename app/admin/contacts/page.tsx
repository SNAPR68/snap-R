import { adminSupabase } from '@/lib/supabase/admin';
import { Mail, Clock, CheckCircle, MessageSquare, AlertCircle, User, Calendar } from 'lucide-react';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';

async function updateStatus(formData: FormData) {
  'use server';
  const { adminSupabase } = await import('@/lib/supabase/admin');
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  await adminSupabase().from('contact_submissions').update({ status }).eq('id', id);
  revalidatePath('/admin/contacts');
}

export default async function AdminContacts() {
  const { data: submissions } = await adminSupabase()
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  const total = submissions?.length || 0;
  const newCount = submissions?.filter((s: any) => s.status === 'new' || !s.status).length || 0;
  const pendingCount = submissions?.filter((s: any) => s.status === 'pending').length || 0;
  const repliedCount = submissions?.filter((s: any) => s.status === 'replied').length || 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCount = submissions?.filter((s: any) => new Date(s.created_at) >= sevenDaysAgo).length || 0;

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <p className="text-white/50">Manage inquiries from the contact form</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <MessageSquare className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-white/50 text-xs">Total</p>
        </div>
        <div className="bg-[#1A1A1A] border border-blue-500/30 rounded-xl p-4">
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
          <p className="text-2xl font-bold">{thisWeekCount}</p>
          <p className="text-white/50 text-xs">This Week</p>
        </div>
      </div>

      {newCount > 0 && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <p className="text-blue-400">{newCount} new message{newCount > 1 ? 's' : ''} need your attention</p>
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        {submissions && submissions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {submissions.map((sub: any) => {
              const status = sub.status || 'new';
              return (
                <div key={sub.id} className={`p-6 hover:bg-white/5 transition ${status === 'new' ? 'bg-blue-500/5' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-semibold">
                          {(sub.name || sub.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-white">{sub.name || 'Anonymous'}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                              status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>{status}</span>
                          </div>
                          <a href={`mailto:${sub.email}`} className="text-[#D4A017] text-sm hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />{sub.email}
                          </a>
                        </div>
                      </div>
                      {sub.subject && <p className="text-white/80 font-medium mb-2">Subject: {sub.subject}</p>}
                      <div className="p-4 bg-black/30 rounded-lg mb-3">
                        <p className="text-white/70 text-sm whitespace-pre-wrap">{sub.message}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(sub.created_at)}</span>
                        <span>{new Date(sub.created_at).toLocaleString()}</span>
                        {sub.phone && <span>📞 {sub.phone}</span>}
                      </div>
                    </div>
                    <div className="flex lg:flex-col gap-2">
                      <a
                        href={`mailto:${sub.email}?subject=Re: ${sub.subject || 'Your SnapR Inquiry'}&body=%0A%0A---%0AOriginal message:%0A${encodeURIComponent(sub.message || '')}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-medium rounded-lg hover:opacity-90 transition"
                      >
                        <Mail className="w-4 h-4" />Reply
                      </a>
                      {status !== 'pending' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={sub.id} />
                          <input type="hidden" name="status" value="pending" />
                          <button className="w-full px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />Pending
                          </button>
                        </form>
                      )}
                      {status !== 'replied' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={sub.id} />
                          <input type="hidden" name="status" value="replied" />
                          <button className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" />Replied
                          </button>
                        </form>
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
            <p className="text-white/40 text-sm mt-1">Submissions will appear here</p>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="mt-6 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl">
          <p className="text-white/50 text-sm">
            Showing {total} submission{total > 1 ? 's' : ''} • Response rate: {total > 0 ? ((repliedCount / total) * 100).toFixed(0) : 0}%
          </p>
        </div>
      )}
    </div>
  );
}
