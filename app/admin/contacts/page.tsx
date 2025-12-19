import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Mail, Clock, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

async function updateStatus(formData: FormData) {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  
  await supabase.from('contact_submissions').update({ status }).eq('id', id);
  revalidatePath('/admin/contacts');
}

export default async function AdminContacts() {
  const { data: submissions } = await serviceSupabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  const total = submissions?.length || 0;
  const newCount = submissions?.filter(s => s.status === 'new' || !s.status).length || 0;
  const repliedCount = submissions?.filter(s => s.status === 'replied').length || 0;
  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <p className="text-white/50">Manage inquiries from the contact form</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
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
      </div>

      {newCount > 0 && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <p className="text-blue-400">{newCount} new message{newCount > 1 ? 's' : ''} need attention</p>
        </div>
      )}

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        {submissions && submissions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {submissions.map((sub: any) => {
              const status = sub.status || 'new';
              return (
                <div key={sub.id} className={`p-6 ${status === 'new' ? 'bg-blue-500/5' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-semibold">
                          {(sub.name || sub.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{sub.name || 'Anonymous'}</p>
                          <a href={`mailto:${sub.email}`} className="text-[#D4A017] text-sm hover:underline">
                            {sub.email}
                          </a>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                          status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="p-4 bg-black/20 rounded-lg mb-3">
                        <p className="text-white/70 text-sm whitespace-pre-wrap">{sub.message}</p>
                      </div>
                      <p className="text-white/30 text-xs">{timeAgo(sub.created_at)} • {new Date(sub.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`mailto:${sub.email}?subject=Re: Your SnapR Inquiry`}
                        className="px-4 py-2 bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black font-medium rounded-lg text-center text-sm"
                      >
                        Reply
                      </a>
                      {status !== 'pending' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={sub.id} />
                          <input type="hidden" name="status" value="pending" />
                          <button className="w-full px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30">
                            Mark Pending
                          </button>
                        </form>
                      )}
                      {status !== 'replied' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={sub.id} />
                          <input type="hidden" name="status" value="replied" />
                          <button className="w-full px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30">
                            Mark Replied
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
          <div className="p-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#D4A017]" />
            <p className="text-white">No contact submissions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
