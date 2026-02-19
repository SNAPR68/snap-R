import { adminSupabase } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { Handshake, Users, CheckCircle, Clock, XCircle, Link2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function updatePartnerStatus(formData: FormData) {
  'use server';
  const { adminSupabase } = await import('@/lib/supabase/admin');
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;

  await adminSupabase()
    .from('partner_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/admin/partners');
}

export default async function AdminPartnersPage() {
  const supabase = adminSupabase();

  // Fetch all partner applications
  const { data: applications, error } = await supabase
    .from('partner_applications')
    .select('*')
    .order('created_at', { ascending: false });

  const partners = applications || [];

  // Stats
  const pending = partners.filter(p => p.status === 'pending').length;
  const approved = partners.filter(p => p.status === 'approved').length;
  const rejected = partners.filter(p => p.status === 'rejected').length;

  // Get referral counts for approved partners
  const approvedPartners = partners.filter(p => p.status === 'approved' && p.referral_code);
  const referralCounts: Record<string, number> = {};

  if (approvedPartners.length > 0) {
    const codes = approvedPartners.map(p => p.referral_code);
    const { data: referrals } = await supabase
      .from('profiles')
      .select('referred_by')
      .in('referred_by', codes);

    if (referrals) {
      referrals.forEach((r: any) => {
        if (r.referred_by) {
          referralCounts[r.referred_by] = (referralCounts[r.referred_by] || 0) + 1;
        }
      });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Handshake className="w-8 h-8 text-[#D4A017]" />
          Partner Applications
        </h1>
        <p className="text-white/50 mt-1">
          Review and manage partner program applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Users className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{partners.length}</p>
          <p className="text-white/50 text-xs">Total Applications</p>
        </div>
        <div className="bg-[#1A1A1A] border border-yellow-500/30 rounded-xl p-4">
          <Clock className="w-5 h-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-yellow-400">{pending}</p>
          <p className="text-white/50 text-xs">Pending Review</p>
        </div>
        <div className="bg-[#1A1A1A] border border-green-500/30 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-400">{approved}</p>
          <p className="text-white/50 text-xs">Approved</p>
        </div>
        <div className="bg-[#1A1A1A] border border-red-500/30 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-red-400">{rejected}</p>
          <p className="text-white/50 text-xs">Rejected</p>
        </div>
      </div>

      {/* Table */}
      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#D4A017]/20 flex items-center justify-center mb-4">
            <Handshake className="w-8 h-8 text-[#D4A017]" />
          </div>
          <p className="text-white font-medium">No partner applications yet</p>
          <p className="text-white/40 text-sm mt-1">Applications submitted at /partners will appear here</p>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-white/60 font-medium">Applicant</th>
                  <th className="text-left p-4 text-white/60 font-medium">Type</th>
                  <th className="text-left p-4 text-white/60 font-medium">Company</th>
                  <th className="text-left p-4 text-white/60 font-medium">Referral Code</th>
                  <th className="text-left p-4 text-white/60 font-medium">Referrals</th>
                  <th className="text-left p-4 text-white/60 font-medium">Applied</th>
                  <th className="text-left p-4 text-white/60 font-medium">Status</th>
                  <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.id} className="border-t border-white/5 hover:bg-white/5">
                    {/* Applicant */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-semibold text-sm">
                          {partner.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{partner.name}</p>
                          <p className="text-white/40 text-xs">{partner.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-4">
                      <span className="text-sm text-white/70">
                        {partner.partner_type?.replace(/_/g, ' ') || '-'}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="p-4">
                      <span className="text-sm text-white/70">{partner.company || '-'}</span>
                    </td>

                    {/* Referral Code */}
                    <td className="p-4">
                      {partner.referral_code ? (
                        <code className="text-xs bg-white/10 px-2 py-1 rounded font-mono text-[#D4A017]">
                          {partner.referral_code}
                        </code>
                      ) : (
                        <span className="text-white/30 text-xs">-</span>
                      )}
                    </td>

                    {/* Referral Count */}
                    <td className="p-4">
                      {partner.status === 'approved' && partner.referral_code ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Link2 className="w-3.5 h-3.5 text-[#D4A017]" />
                          {referralCounts[partner.referral_code] || 0}
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">-</span>
                      )}
                    </td>

                    {/* Applied date */}
                    <td className="p-4">
                      <span className="text-xs text-white/50">
                        {new Date(partner.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {partner.status === 'pending' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                          Pending
                        </span>
                      )}
                      {partner.status === 'approved' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 font-medium">
                          Approved
                        </span>
                      )}
                      {partner.status === 'rejected' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 font-medium">
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {partner.status !== 'approved' && (
                          <form action={updatePartnerStatus}>
                            <input type="hidden" name="id" value={partner.id} />
                            <input type="hidden" name="status" value="approved" />
                            <button className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition">
                              Approve
                            </button>
                          </form>
                        )}
                        {partner.status !== 'rejected' && (
                          <form action={updatePartnerStatus}>
                            <input type="hidden" name="id" value={partner.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition">
                              Reject
                            </button>
                          </form>
                        )}
                        {partner.status !== 'pending' && (
                          <form action={updatePartnerStatus}>
                            <input type="hidden" name="id" value={partner.id} />
                            <input type="hidden" name="status" value="pending" />
                            <button className="px-2 py-1 bg-white/10 text-white/60 rounded text-xs hover:bg-white/20 transition">
                              Reset
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message preview for pending applications */}
      {pending > 0 && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-200 text-sm font-medium">
            {pending} application{pending > 1 ? 's' : ''} awaiting review
          </p>
          <p className="text-white/40 text-xs mt-1">
            Approved partners receive their referral link and dashboard access immediately.
          </p>
        </div>
      )}
    </div>
  );
}
