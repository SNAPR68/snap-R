import { createClient } from '@/lib/supabase/server';
import { Users, Image, Zap, DollarSign, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true });
  const { count: photosCount } = await supabase.from('photos').select('*', { count: 'exact', head: true });
  const { count: enhancementsCount } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('status', 'completed');
  const { count: pendingEdits } = await supabase.from('human_edit_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: planCounts } = await supabase.from('profiles').select('plan');
  const plans = {
    free: planCounts?.filter(p => !p.plan || p.plan === 'free').length || 0,
    starter: planCounts?.filter(p => p.plan === 'starter').length || 0,
    professional: planCounts?.filter(p => p.plan === 'professional').length || 0,
    agency: planCounts?.filter(p => p.plan === 'agency').length || 0,
  };
  const totalUsers = Object.values(plans).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-white/50 mb-8">Overview of SnapR platform</p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-3xl font-bold">{usersCount || 0}</p>
          <p className="text-white/50 text-sm">Total Users</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Image className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-3xl font-bold">{listingsCount || 0}</p>
          <p className="text-white/50 text-sm">Listings</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Image className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-3xl font-bold">{photosCount || 0}</p>
          <p className="text-white/50 text-sm">Photos</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Zap className="w-6 h-6 text-[#D4A017] mb-2" />
          <p className="text-3xl font-bold">{enhancementsCount || 0}</p>
          <p className="text-white/50 text-sm">Enhancements</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Clock className="w-6 h-6 text-orange-400 mb-2" />
          <p className="text-3xl font-bold">{pendingEdits || 0}</p>
          <p className="text-white/50 text-sm">Pending Edits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {Object.entries(plans).map(([plan, count]) => (
              <div key={plan}>
                <div className="flex justify-between mb-1">
                  <span className="capitalize">{plan}</span>
                  <span>{count} users ({totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div 
                    className="h-full bg-[#D4A017] rounded-full"
                    style={{ width: `${totalUsers > 0 ? (count / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Signups</h2>
          <div className="space-y-3">
            {recentUsers?.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-white/50 text-sm">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.plan === 'agency' ? 'bg-purple-500/20 text-purple-400' :
                    user.plan === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                    user.plan === 'starter' ? 'bg-green-500/20 text-green-400' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {user.plan || 'free'}
                  </span>
                  <p className="text-[#D4A017] text-sm mt-1">{user.credits || 0} credits</p>
                </div>
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="text-white/50 text-center py-4">No users yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
