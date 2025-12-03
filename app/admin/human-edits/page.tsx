import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { HumanEditActions } from './actions';

export default async function AdminHumanEdits() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('human_edit_orders')
    .select('*')
    .order('created_at', { ascending: false });

  // Get user emails separately
  const userIds = [...new Set(orders?.map(o => o.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Human Edit Orders</h1>
          <p className="text-white/50">Manage and fulfill manual edit requests</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">
            {orders?.filter(o => o.status === 'pending').length || 0} Pending
          </span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm">
            {orders?.filter(o => o.status === 'completed').length || 0} Completed
          </span>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-white/60 font-medium">Customer</th>
              <th className="text-left p-4 text-white/60 font-medium">Photo</th>
              <th className="text-left p-4 text-white/60 font-medium">Instructions</th>
              <th className="text-left p-4 text-white/60 font-medium">Priority</th>
              <th className="text-left p-4 text-white/60 font-medium">Amount</th>
              <th className="text-left p-4 text-white/60 font-medium">Status</th>
              <th className="text-left p-4 text-white/60 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => {
              const profile = profileMap.get(order.user_id);
              return (
                <tr key={order.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                    <p className="text-white/50 text-sm">{profile?.email}</p>
                  </td>
                  <td className="p-4">
                    {order.photo_url && (
                      <a href={order.photo_url} target="_blank" className="text-[#D4A017] hover:underline text-sm">
                        View Photo →
                      </a>
                    )}
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-white/70 text-sm truncate">{order.instructions || 'No instructions'}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${order.is_urgent ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/50'}`}>
                      {order.is_urgent ? '🚨 4h' : '24h'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-green-400 font-medium">${((order.amount_paid || 0) / 100).toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <HumanEditActions orderId={order.id} status={order.status} userEmail={profile?.email} />
                  </td>
                </tr>
              );
            })}
            {!orders?.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/50">
                  No human edit orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
