import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { Mail, Clock, CheckCircle } from 'lucide-react';

export default async function AdminContacts() {
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Contact Submissions</h1>
      <p className="text-white/50 mb-8">Inquiries from the contact form</p>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        {submissions?.map((sub) => (
          <div key={sub.id} className="p-4 border-b border-white/5 hover:bg-white/5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{sub.name}</p>
                <p className="text-[#D4A017] text-sm">{sub.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${sub.status === 'new' ? 'bg-blue-500/20 text-blue-400' : sub.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                  {sub.status}
                </span>
                <span className="text-white/40 text-xs">
                  {new Date(sub.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <p className="text-white/70 text-sm">{sub.message}</p>
            <div className="flex gap-2 mt-3">
              <a 
                href={`mailto:${sub.email}?subject=Re: Your SnapR Inquiry`} 
                className="text-xs px-3 py-1 bg-[#D4A017] text-black rounded hover:opacity-90"
              >
                Reply
              </a>
            </div>
          </div>
        ))}
        {!submissions?.length && (
          <p className="text-white/50 text-center py-8">No contact submissions yet</p>
        )}
      </div>
    </div>
  );
}
