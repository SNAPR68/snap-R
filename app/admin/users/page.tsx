import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Users, DollarSign, Zap, Clock, Crown, TrendingUp, Download } from 'lucide-react';
import { revalidatePath } from 'next/cache';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

async function updateUserPlan(formData: FormData) {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const userId = formData.get('userId') as string;
  const plan = formData.get('plan') as string;
  await supabase.from('profiles').update({ plan }).eq('id', userId);
  revalidatePath('/admin/users');
}

async function addCredits(formData: FormData) {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const userId = formData.get('userId') as string;
  const amount = parseInt(formData.get('amount') as string) || 0;
  const { data: user } = await supabase.from('profiles').select('credits').eq('id', userId).single();
  await supabase.from('profiles').update({ credits: (user?.credits || 0) + amount }).eq('id', userId);
  revalidatePath('/admin/users');
}

export default async function AdminUsers() {
  const { data: users } = await serviceSupabase.from('profiles').select('*').order('created_at', { ascending: false });
  const { data: apiCosts } = await serviceSupabase.from('api_costs').select('user_id, cost_cents, credits_charged, created_at');

  const userStats: Record<string, { cost: number; credits: number; count: number; lastActive: string }> = {};
  (apiCosts || []).forEach((c: any) => {
    if (!userStats[c.user_id]) userStats[c.user_id] = { cost: 0, credits: 0, count: 0, lastActive: c.created_at };
    userStats[c.user_id].cost += c.cost_cents || 0;
    userStats[c.user_id].credits += c.credits_charged || 0;
    userStats[c.user_id].count += 1;
    if (new Date(c.created_at) > new Date(userStats[c.user_id].lastActive)) {
      userStats[c.user_id].lastActive = c.created_at;
    }
  });

  const totalUsers = users?.length || 0;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newUsers30d = users?.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length || 0;
  const activeUsers7d = Object.values(userStats).filter(s => new Date(s.lastActive) >= sevenDaysAgo).length;
  const paidUsers = users?.filter(u => u.plan && u.plan !== 'free').length || 0;

  const sortedUsers = [...(users || [])].sort((a, b) => (userStats[b.id]?.cost || 0) - (userStats[a.id]?.cost || 0));

  const timeAgo = (date: string) => {
    if (!date) return 'Never';
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const planColors: Record<string, string> = {
    team: 'bg-purple-500/20 text-purple-400',
    pro: 'bg-green-500/20 text-green-400',
    free: 'bg-white/10 text-white/50',
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-white/50">Manage users and track activity</p>
        </div>
        <a 
          href="/api/admin/users/export" 
          className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium hover:bg-[#B8860B]"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Users className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-white/50 text-xs">Total</p>
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
          <p className="text-white/50 text-xs">Paid</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold">${(Object.values(userStats).reduce((s, u) => s + u.cost, 0) / 100).toFixed(2)}</p>
          <p className="text-white/50 text-xs">Total Cost</p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 font-medium">User</th>
                <th className="text-left p-4 text-white/60 font-medium">Plan</th>
                <th className="text-left p-4 text-white/60 font-medium">Credits</th>
                <th className="text-left p-4 text-white/60 font-medium">Uses</th>
                <th className="text-left p-4 text-white/60 font-medium">Cost</th>
                <th className="text-left p-4 text-white/60 font-medium">Last Active</th>
                <th className="text-left p-4 text-white/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user: any) => {
                const stats = userStats[user.id] || { cost: 0, credits: 0, count: 0, lastActive: '' };
                const plan = user.plan || 'free';
                return (
                  <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-white/50 text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${planColors[plan] || planColors.free}`}>
                        {plan}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#D4A017] font-medium">{user.credits || 0}</span>
                    </td>
                    <td className="p-4">{stats.count}</td>
                    <td className="p-4">
                      <span className={stats.cost > 100 ? 'text-red-400' : 'text-white/60'}>
                        ${(stats.cost / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-white/50 text-sm">{timeAgo(stats.lastActive)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <form action={updateUserPlan} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={user.id} />
                          <select name="plan" defaultValue={plan} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="team">Team</option>
                          </select>
                          <button className="px-2 py-1 bg-[#D4A017]/20 text-[#D4A017] rounded text-xs">Set</button>
                        </form>
                        <form action={addCredits} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="number" name="amount" defaultValue={50} className="w-14 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white" />
                          <button className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">+Cr</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
