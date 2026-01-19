import { adminSupabase } from '@/lib/supabase/admin';
import { Users, DollarSign, TrendingUp, Server, Zap, Camera, Image, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const [
    { data: profiles },
    { data: costs },
    { data: costsYesterday },
    { data: humanEdits },
    { data: listings },
    { data: photos },
    { data: recentErrors },
    { data: recentContacts },
  ] = await Promise.all([
    adminSupabase().from('profiles').select('id, email, full_name, plan, credits, created_at'),
    adminSupabase().from('api_costs').select('provider, cost_cents, credits_charged, created_at, user_id').gte('created_at', thirtyDaysAgo.toISOString()),
    adminSupabase().from('api_costs').select('cost_cents').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
    adminSupabase().from('human_edit_orders').select('amount_paid, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
    adminSupabase().from('listings').select('id, created_at'),
    adminSupabase().from('photos').select('id, status, created_at'),
    adminSupabase().from('error_logs').select('id, severity').eq('resolved', false),
    adminSupabase().from('contact_submissions').select('id').or('status.eq.new,status.is.null'),
  ]);

  // User metrics
  const totalUsers = profiles?.length || 0;
  const newSignups30d = profiles?.filter((p: any) => new Date(p.created_at) >= thirtyDaysAgo).length || 0;
  const newSignupsToday = profiles?.filter((p: any) => new Date(p.created_at) >= today).length || 0;
  const activeUsers7d = new Set(costs?.filter((c: any) => new Date(c.created_at) >= sevenDaysAgo).map((c: any) => c.user_id)).size;

  // Plan breakdown
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

  // Revenue & Costs
  const humanEditRevenue = (humanEdits || []).reduce((sum: number, o: any) => sum + (o.amount_paid || 0), 0) / 100;
  
  const costByProvider: Record<string, number> = {};
  let totalCostCents = 0;
  let todayCostCents = 0;
  
  (costs || []).forEach((cost: any) => {
    costByProvider[cost.provider] = (costByProvider[cost.provider] || 0) + cost.cost_cents;
    totalCostCents += cost.cost_cents;
    if (new Date(cost.created_at) >= today) {
      todayCostCents += cost.cost_cents;
    }
  });
  
  const yesterdayCost = (costsYesterday || []).reduce((sum: number, c: any) => sum + (c.cost_cents || 0), 0);
  const costChange = yesterdayCost > 0 ? ((todayCostCents - yesterdayCost) / yesterdayCost) * 100 : 0;
  
  const totalCost = totalCostCents / 100;
  const totalEnhancements = costs?.length || 0;
  const enhancementsToday = costs?.filter((c: any) => new Date(c.created_at) >= today).length || 0;

  const profit = humanEditRevenue - totalCost;
  const unresolvedErrors = recentErrors?.length || 0;
  const criticalErrors = recentErrors?.filter((e: any) => e.severity === 'critical').length || 0;
  const newContacts = recentContacts?.length || 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/50">Real-time executive overview</p>
        </div>
        <div className="text-right text-sm text-white/40">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-6">
        {criticalErrors > 0 && (
          <Link href="/admin/logs" className="block p-4 bg-red-500/20 border border-red-500/50 rounded-xl hover:bg-red-500/30 transition animate-pulse">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-red-400" />
              <span className="font-medium text-red-400">{criticalErrors} CRITICAL Error{criticalErrors > 1 ? 's' : ''}</span>
              <ArrowUpRight className="w-4 h-4 text-red-400 ml-auto" />
            </div>
          </Link>
        )}
        {unresolvedErrors > 0 && criticalErrors === 0 && (
          <Link href="/admin/logs" className="block p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">{unresolvedErrors} unresolved error{unresolvedErrors > 1 ? 's' : ''}</span>
              <ArrowUpRight className="w-4 h-4 text-yellow-400 ml-auto" />
            </div>
          </Link>
        )}
        {newContacts > 0 && (
          <Link href="/admin/contacts" className="block p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">{newContacts} new contact message{newContacts > 1 ? 's' : ''}</span>
              <ArrowUpRight className="w-4 h-4 text-blue-400 ml-auto" />
            </div>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-6 h-6 text-[#D4A017]" />
            {newSignupsToday > 0 && <span className="text-xs text-green-400">+{newSignupsToday} today</span>}
          </div>
          <p className="text-3xl font-bold">{totalUsers}</p>
          <p className="text-white/40 text-sm">Total Users</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-white/40">{totalUsers > 0 ? ((activeUsers7d / totalUsers) * 100).toFixed(0) : 0}%</span>
          </div>
          <p className="text-3xl font-bold">{activeUsers7d}</p>
          <p className="text-white/40 text-sm">Active (7d)</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Camera className="w-6 h-6 text-cyan-400" />
            <span className="text-xs text-white/40">+{listingsThisMonth} this mo</span>
          </div>
          <p className="text-3xl font-bold">{totalListings}</p>
          <p className="text-white/40 text-sm">Listings</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Image className="w-6 h-6 text-pink-400" />
            <span className="text-xs text-white/40">{enhancedPhotos} enhanced</span>
          </div>
          <p className="text-3xl font-bold">{totalPhotos}</p>
          <p className="text-white/40 text-sm">Photos</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-green-400">+{enhancementsToday} today</span>
          </div>
          <p className="text-3xl font-bold">{totalEnhancements}</p>
          <p className="text-white/40 text-sm">Enhancements (30d)</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Server className="w-6 h-6 text-red-400" />
            <div className={`flex items-center gap-1 text-xs ${costChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {costChange <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(costChange).toFixed(0)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">${totalCost.toFixed(2)}</p>
          <p className="text-white/40 text-sm">AI Costs (30d)</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">${humanEditRevenue.toFixed(2)}</p>
          <p className="text-white/40 text-sm">Revenue (30d)</p>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-[#D4A017]" />
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toFixed(2)}</p>
          <p className="text-white/40 text-sm">Net Profit</p>
        </div>
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">User Plans</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/60">Free</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30 rounded-full" style={{ width: `${totalUsers > 0 ? (planCounts.free / totalUsers) * 100 : 0}%` }} />
                </div>
                <span className="font-bold w-8 text-right">{planCounts.free}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500">
              <span className="text-white/60">Pro</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalUsers > 0 ? (planCounts.pro / totalUsers) * 100 : 0}%` }} />
                </div>
                <span className="font-bold text-green-400 w-8 text-right">{planCounts.pro}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border-l-4 border-purple-500">
              <span className="text-white/60">Team</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${totalUsers > 0 ? (planCounts.team / totalUsers) * 100 : 0}%` }} />
                </div>
                <span className="font-bold text-purple-400 w-8 text-right">{planCounts.team}</span>
              </div>
            </div>
          </div>
        </div>

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
          { label: 'Users', href: '/admin/users', icon: Users, count: totalUsers },
          { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
          { label: 'Revenue', href: '/admin/revenue', icon: DollarSign },
          { label: 'Errors', href: '/admin/logs', icon: Server, count: unresolvedErrors, alert: unresolvedErrors > 0 },
        ].map((link) => (
          <Link key={link.href} href={link.href} className={`flex items-center justify-between p-4 bg-[#1A1A1A] border rounded-xl hover:border-[#D4A017]/50 transition ${link.alert ? 'border-red-500/50' : 'border-white/10'}`}>
            <div className="flex items-center gap-2">
              <link.icon className="w-4 h-4 text-[#D4A017]" />
              {link.label}
            </div>
            {link.count !== undefined && (
              <span className={`text-sm ${link.alert ? 'text-red-400' : 'text-white/40'}`}>{link.count}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
