import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Users, DollarSign, TrendingUp, Server, Zap, Camera, Image, Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Parallel data fetching
  const [
    { data: profiles },
    { data: costs },
    { data: humanEdits },
    { data: listings },
    { data: photos },
    { data: recentErrors },
  ] = await Promise.all([
    serviceSupabase.from('profiles').select('id, email, full_name, plan, credits, created_at'),
    serviceSupabase.from('api_costs').select('provider, cost_cents, credits_charged, created_at, user_id').gte('created_at', thirtyDaysAgo.toISOString()),
    serviceSupabase.from('human_edit_orders').select('amount_paid, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
    serviceSupabase.from('listings').select('id, created_at'),
    serviceSupabase.from('photos').select('id, status, created_at'),
    serviceSupabase.from('error_logs').select('id').eq('resolved', false),
  ]);

  // User metrics
  const totalUsers = profiles?.length || 0;
  const newSignups30d = profiles?.filter((p: any) => new Date(p.created_at) >= thirtyDaysAgo).length || 0;
  const newSignupsToday = profiles?.filter((p: any) => new Date(p.created_at) >= today).length || 0;
  const activeUsers7d = new Set(costs?.filter((c: any) => new Date(c.created_at) >= sevenDaysAgo).map((c: any) => c.user_id)).size;

  // Plan breakdown (correct plan names)
  const planCounts = {
    free: profiles?.filter((p: any) => !p.plan || p.plan === 'free').length || 0,
    pro: profiles?.filter((p: any) => p.plan === 'pro').length || 0,
    team: profiles?.filter((p: any) => p.plan === 'team').length || 0,
  };

  // Listings & Photos
  const totalListings = listings?.length || 0;
  const listingsThisMonth = listings?.filter((l: any) => new Date(l.created_at) >= thirtyDaysAgo).length || 0;
  const totalPhotos = photos?.length || 0;
  const enhancedPhotos = photos?.filter((p: any) => p.status === 'completed' || p.status === 'enhanced').length || 0;

  // Revenue
  const humanEditRevenue = (humanEdits || []).reduce((sum: number, o: any) => sum + (o.amount_paid || 0), 0) / 100;

  // Costs
  const costByProvider: Record<string, number> = {};
  let totalCostCents = 0;
  
  (costs || []).forEach((cost: any) => {
    costByProvider[cost.provider] = (costByProvider[cost.provider] || 0) + cost.cost_cents;
    totalCostCents += cost.cost_cents;
  });
  
  const totalCost = totalCostCents / 100;
  const totalEnhancements = costs?.length || 0;
  const enhancementsToday = costs?.filter((c: any) => new Date(c.created_at) >= today).length || 0;

  // Profit
  const profit = humanEditRevenue - totalCost;
  const unresolvedErrors = recentErrors?.length || 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/50">Real-time executive overview</p>
        </div>
        <div className="text-right text-sm text-white/40">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Error Alert */}
      {unresolvedErrors > 0 && (
        <Link href="/admin/logs" className="block mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-400">{unresolvedErrors} Unresolved Error{unresolvedErrors > 1 ? 's' : ''}</p>
              <p className="text-white/50 text-sm">Click to view and resolve</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-red-400 ml-auto" />
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#D4A017]" />
            </div>
            <span className="text-white/50 text-sm">Users</span>
          </div>
          <p className="text-3xl font-bold">{totalUsers}</p>
          <p className="text-green-400 text-sm mt-1">+{newSignupsToday} today • {newSignups30d} this month</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/50 text-sm">Active (7d)</span>
          </div>
          <p className="text-3xl font-bold">{activeUsers7d}</p>
          <p className="text-white/40 text-sm mt-1">{totalUsers > 0 ? ((activeUsers7d / totalUsers) * 100).toFixed(0) : 0}% of users</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-white/50 text-sm">Listings</span>
          </div>
          <p className="text-3xl font-bold">{totalListings}</p>
          <p className="text-white/40 text-sm mt-1">+{listingsThisMonth} this month</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-pink-400" />
            </div>
            <span className="text-white/50 text-sm">Photos</span>
          </div>
          <p className="text-3xl font-bold">{totalPhotos}</p>
          <p className="text-white/40 text-sm mt-1">{enhancedPhotos} enhanced</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/50 text-sm">Enhancements</span>
          </div>
          <p className="text-3xl font-bold">{enhancementsToday}</p>
          <p className="text-white/40 text-sm mt-1">{totalEnhancements} this month</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-white/50 text-sm">AI Costs (30d)</span>
          </div>
          <p className="text-3xl font-bold text-red-400">${totalCost.toFixed(2)}</p>
          <p className="text-white/40 text-sm mt-1">${totalEnhancements > 0 ? (totalCost / totalEnhancements).toFixed(3) : '0'}/enhancement</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/50 text-sm">Revenue (30d)</span>
          </div>
          <p className="text-3xl font-bold text-green-400">${humanEditRevenue.toFixed(2)}</p>
          <p className="text-white/40 text-sm mt-1">Human edits</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A017]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#D4A017]" />
            </div>
            <span className="text-white/50 text-sm">Net Profit</span>
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toFixed(2)}</p>
          <p className="text-white/40 text-sm mt-1">Revenue - Costs</p>
        </div>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Plan Breakdown */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">User Plans</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60">Free</span>
              <span className="font-bold">{planCounts.free}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500">
              <span className="text-white/60">Pro ($12/listing)</span>
              <span className="font-bold text-green-400">{planCounts.pro}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border-l-4 border-purple-500">
              <span className="text-white/60">Team</span>
              <span className="font-bold text-purple-400">{planCounts.team}</span>
            </div>
          </div>
        </div>

        {/* Cost by Provider */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">AI Costs by Provider</h2>
          {Object.keys(costByProvider).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(costByProvider).sort((a, b) => b[1] - a[1]).map(([provider, cents]) => {
                const pct = totalCostCents > 0 ? (cents / totalCostCents) * 100 : 0;
                return (
                  <div key={provider}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white capitalize">{provider}</span>
                      <span className="text-white/60">${(cents / 100).toFixed(2)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full">
                      <div className="h-full bg-[#D4A017] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40 text-center py-4">No cost data</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Users', href: '/admin/users', icon: Users },
          { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
          { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
          { label: 'Errors', href: '/admin/logs', icon: Server },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center justify-center gap-2 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-[#D4A017]/50 hover:text-[#D4A017] transition">
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
