import { createClient } from '@/lib/supabase/server';
import { Users, DollarSign, TrendingUp, Server, Zap, Calendar, ArrowUpRight } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch data
  const { data: profiles } = await supabase.from('profiles').select('plan, created_at');
  const { data: costs } = await supabase.from('api_costs').select('provider, cost_cents, created_at').gte('created_at', thirtyDaysAgo.toISOString());
  const { data: humanEdits } = await supabase.from('human_edit_orders').select('amount_paid, created_at').gte('created_at', thirtyDaysAgo.toISOString());

  // User metrics
  const totalUsers = profiles?.length || 0;
  const newSignups30d = profiles?.filter((p: any) => new Date(p.created_at) >= thirtyDaysAgo).length || 0;

  // Plan counts
  const starterCount = profiles?.filter((p: any) => p.plan === 'starter').length || 0;
  const proCount = profiles?.filter((p: any) => p.plan === 'professional').length || 0;
  const agencyCount = profiles?.filter((p: any) => p.plan === 'agency').length || 0;

  // Revenue
  const mrr = (starterCount * 29) + (proCount * 79) + (agencyCount * 199);
  const humanEditRevenue = (humanEdits || []).reduce((sum: number, o: any) => sum + (o.amount_paid || 0), 0) / 100;
  const totalRevenue = mrr + humanEditRevenue;

  // Costs by provider
  const costByProvider: Record<string, number> = {};
  (costs || []).forEach((cost: any) => {
    costByProvider[cost.provider] = (costByProvider[cost.provider] || 0) + cost.cost_cents;
  });
  const totalCostCents = Object.values(costByProvider).reduce((a, b) => a + b, 0);
  const totalCost = totalCostCents / 100;

  // Profit
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

  // Enhancements today
  const enhancementsToday = costs?.filter((c: any) => new Date(c.created_at) >= today).length || 0;
  const totalEnhancements30d = costs?.length || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-white/50">Executive overview</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Users */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#D4A017]" />
            </div>
            <span className="text-white/50">Total Users</span>
          </div>
          <p className="text-3xl font-bold">{totalUsers}</p>
          <p className="text-white/40 text-sm mt-1">{newSignups30d} new this month</p>
        </div>

        {/* Revenue */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/50">Revenue (30d)</span>
          </div>
          <p className="text-3xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
          <p className="text-white/40 text-sm mt-1">MRR: ${mrr} + Edits: ${humanEditRevenue.toFixed(2)}</p>
        </div>

        {/* AI Costs */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/50">AI Costs (30d)</span>
          </div>
          <p className="text-3xl font-bold text-red-400">${totalCost.toFixed(2)}</p>
          <p className="text-white/40 text-sm mt-1">{totalEnhancements30d} enhancements</p>
        </div>

        {/* Profit Margin */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#D4A017]" />
            </div>
            <span className="text-white/50">Profit Margin</span>
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profitMargin}%</p>
          <p className="text-white/40 text-sm mt-1">${profit.toFixed(2)} profit</p>
        </div>

        {/* Enhancements Today */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/50">Enhancements Today</span>
          </div>
          <p className="text-3xl font-bold">{enhancementsToday}</p>
          <p className="text-white/40 text-sm mt-1">{totalEnhancements30d} this month</p>
        </div>

        {/* Plan Breakdown */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/50">Subscriptions</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Starter ($29)</span>
              <span className="text-white">{starterCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Professional ($79)</span>
              <span className="text-white">{proCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Agency ($199)</span>
              <span className="text-white">{agencyCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost by Provider */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">AI Costs by Provider</h2>
        {Object.keys(costByProvider).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(costByProvider)
              .sort((a, b) => b[1] - a[1])
              .map(([provider, cents]) => {
                const percentage = totalCostCents > 0 ? (cents / totalCostCents) * 100 : 0;
                return (
                  <div key={provider}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white capitalize">{provider}</span>
                      <span className="text-white/60">${(cents / 100).toFixed(2)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-white/40 text-center py-4">No cost data yet</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'View Users', href: '/admin/users' },
          { label: 'Analytics', href: '/admin/analytics' },
          { label: 'Revenue', href: '/admin/revenue' },
          { label: 'Human Edits', href: '/admin/human-edits' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center justify-center gap-2 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white hover:border-[#D4A017]/50 hover:text-[#D4A017] transition-all"
          >
            {link.label}
            <ArrowUpRight className="w-4 h-4" />
          </a>
        ))}
      </div>
    </div>
  );
}