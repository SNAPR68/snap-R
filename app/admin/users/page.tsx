import { createClient } from '@/lib/supabase/server';
import { Users, DollarSign, Zap, Clock, Search, Crown, TrendingUp } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const supabase = await createClient();

  // Get all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all api_costs to calculate per-user stats
  const { data: apiCosts } = await supabase
    .from('api_costs')
    .select('user_id, cost_cents, credits_charged, created_at');

  // Calculate per-user stats
  const userStats: Record<string, { cost: number; credits: number; count: number; lastActive: string }> = {};
  (apiCosts || []).forEach((c: any) => {
    if (!userStats[c.user_id]) {
      userStats[c.user_id] = { cost: 0, credits: 0, count: 0, lastActive: c.created_at };
    }
    userStats[c.user_id].cost += c.cost_cents || 0;
    userStats[c.user_id].credits += c.credits_charged || 0;
    userStats[c.user_id].count += 1;
    if (new Date(c.created_at) > new Date(userStats[c.user_id].lastActive)) {
      userStats[c.user_id].lastActive = c.created_at;
    }
  });

  // Calculate summary stats
  const totalUsers = users?.length || 0;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newUsers30d = users?.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length || 0;
  const activeUsers7d = Object.values(userStats).filter(s => new Date(s.lastActive) >= sevenDaysAgo).length;
  
  const paidUsers = users?.filter(u => u.plan && u.plan !== 'free').length || 0;
  const totalCreditsUsed = Object.values(userStats).reduce((sum, s) => sum + s.credits, 0);
  const totalCostFromUsers = Object.values(userStats).reduce((sum, s) => sum + s.cost, 0);

  // Sort users by cost (highest first)
  const sortedUsers = [...(users || [])].sort((a, b) => {
    const aCost = userStats[a.id]?.cost || 0;
    const bCost = userStats[b.id]?.cost || 0;
    return bCost - aCost;
  });

  // Time ago helper
  const timeAgo = (date: string) => {
    if (!date) return 'Never';
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  // Plan colors
  const planColors: Record<string, string> = {
    agency: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    professional: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    starter: 'bg-green-500/20 text-green-400 border-green-500/30',
    free: 'bg-white/10 text-white/50 border-white/10',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-white/50">Manage users and track activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Users className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-white/50 text-xs">Total Users</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold">{newUsers30d}</p>
          <p className="text-white/50 text-xs">New (30d)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Zap className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{activeUsers7d}</p>
          <p className="text-white/50 text-xs">Active (7d)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Crown className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-2xl font-bold">{paidUsers}</p>
          <p className="text-white/50 text-xs">Paid Users</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold">${(totalCostFromUsers / 100).toFixed(2)}</p>
          <p className="text-white/50 text-xs">Total AI Cost</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Zap className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{totalCreditsUsed}</p>
          <p className="text-white/50 text-xs">Credits Used</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search users by name or email... (client-side search coming soon)"
          className="w-full pl-12 pr-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4A017]/50"
          disabled
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 font-medium">User</th>
                <th className="text-left p-4 text-white/60 font-medium">Plan</th>
                <th className="text-left p-4 text-white/60 font-medium">Credits</th>
                <th className="text-left p-4 text-white/60 font-medium">Enhancements</th>
                <th className="text-left p-4 text-white/60 font-medium">Cost to You</th>
                <th className="text-left p-4 text-white/60 font-medium">Last Active</th>
                <th className="text-left p-4 text-white/60 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, index) => {
                const stats = userStats[user.id] || { cost: 0, credits: 0, count: 0, lastActive: '' };
                const plan = user.plan || user.subscription_tier || 'free';
                
                return (
                  <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-semibold text-sm">
                          {(user.full_name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {user.full_name || 'No name'}
                            {index === 0 && stats.cost > 0 && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Top Cost</span>
                            )}
                          </p>
                          <p className="text-white/50 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${planColors[plan] || planColors.free}`}>
                        {plan === 'free' ? 'Free' : plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#D4A017] font-medium">{user.credits || 0}</span>
                      <span className="text-white/30 text-sm ml-1">left</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{stats.count}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-medium ${stats.cost > 100 ? 'text-red-400' : stats.cost > 0 ? 'text-orange-400' : 'text-white/50'}`}>
                        ${(stats.cost / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className={`text-sm ${stats.lastActive && new Date(stats.lastActive) >= sevenDaysAgo ? 'text-green-400' : 'text-white/50'}`}>
                          {timeAgo(stats.lastActive)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-white/50 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {!users?.length && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/50">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl">
        <p className="text-white/50 text-sm">
          Showing {users?.length || 0} users • Sorted by highest cost to you
        </p>
      </div>
    </div>
  );
}