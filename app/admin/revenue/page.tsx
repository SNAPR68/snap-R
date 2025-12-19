import { adminSupabase } from '@/lib/supabase/admin';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Users, Zap, ArrowUpRight, ArrowDownRight, Server } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminRevenue() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Get profiles for plan counts
  const { data: profiles } = await adminSupabase.from('profiles').select('plan, subscription_tier, created_at');

  // Get AI costs
  const { data: costs30d } = await adminSupabase
    .from('api_costs')
    .select('cost_cents, credits_charged, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: costsPrev30d } = await adminSupabase
    .from('api_costs')
    .select('cost_cents')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  // Get human edit orders
  const { data: humanEdits30d } = await adminSupabase
    .from('human_edit_orders')
    .select('amount_paid, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: humanEditsPrev30d } = await adminSupabase
    .from('human_edit_orders')
    .select('amount_paid')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  // Calculate plan counts (check both plan and subscription_tier)
  const getPlan = (p: any) => p.plan || p.subscription_tier || 'free';
  const paidPlans = {
    starter: profiles?.filter(p => getPlan(p) === 'starter').length || 0,
    pro: profiles?.filter(p => getPlan(p) === 'pro').length || 0,
    agency: profiles?.filter(p => getPlan(p) === 'agency').length || 0,
  };

  // Per-listing model - actual revenue tracked via Stripe
  const mrr = 0; // Placeholder - integrate Stripe for real data
  const totalPaidUsers = paidPlans.starter + paidPlans.pro + paidPlans.agency;

  // Calculate human edit revenue
  const humanEditRevenue = (humanEdits30d || []).reduce((sum, o) => sum + (o.amount_paid || 0), 0) / 100;
  const humanEditRevenuePrev = (humanEditsPrev30d || []).reduce((sum, o) => sum + (o.amount_paid || 0), 0) / 100;

  // Total revenue (30d estimate: MRR + human edits)
  const totalRevenue30d = mrr + humanEditRevenue;
  const totalRevenuePrev30d = mrr + humanEditRevenuePrev; // MRR assumed same for comparison

  // Calculate AI costs
  const totalAICost = (costs30d || []).reduce((sum, c) => sum + (c.cost_cents || 0), 0) / 100;
  const totalAICostPrev = (costsPrev30d || []).reduce((sum, c) => sum + (c.cost_cents || 0), 0) / 100;
  const costChange = totalAICostPrev > 0 ? ((totalAICost - totalAICostPrev) / totalAICostPrev) * 100 : 0;

  // Calculate profit
  const profit = totalRevenue30d - totalAICost;
  const profitPrev = totalRevenuePrev30d - totalAICostPrev;
  const profitMargin = totalRevenue30d > 0 ? (profit / totalRevenue30d) * 100 : 0;
  const profitChange = profitPrev !== 0 ? ((profit - profitPrev) / Math.abs(profitPrev)) * 100 : 0;

  // Credits used
  const totalCreditsUsed = (costs30d || []).reduce((sum, c) => sum + (c.credits_charged || 0), 0);

  // Daily breakdown (last 14 days)
  const dailyData: Record<string, { revenue: number; cost: number; count: number }> = {};
  
  // Initialize days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyData[key] = { revenue: 0, cost: 0, count: 0 };
  }

  // Fill in costs
  (costs30d || []).filter(c => new Date(c.created_at) >= fourteenDaysAgo).forEach(c => {
    const key = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyData[key]) {
      dailyData[key].cost += (c.cost_cents || 0) / 100;
      dailyData[key].count += 1;
    }
  });

  // Fill in human edit revenue
  (humanEdits30d || []).filter(h => new Date(h.created_at) >= fourteenDaysAgo).forEach(h => {
    const key = new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyData[key]) {
      dailyData[key].revenue += (h.amount_paid || 0) / 100;
    }
  });

  // Add daily MRR portion
  const dailyMRR = mrr / 30;
  Object.keys(dailyData).forEach(key => {
    dailyData[key].revenue += dailyMRR;
  });

  const maxDaily = Math.max(...Object.values(dailyData).map(d => Math.max(d.revenue, d.cost)), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Revenue</h1>
        <p className="text-white/50">Financial overview and profitability</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* MRR */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">MRR</span>
          </div>
          <p className="text-3xl font-bold text-green-400">${mrr}</p>
          <p className="text-white/50 text-sm">{totalPaidUsers} paid subscribers</p>
        </div>

        {/* AI Costs */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Server className="w-8 h-8 text-red-400" />
            <div className={`flex items-center gap-1 text-xs ${costChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {costChange <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(costChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">${totalAICost.toFixed(2)}</p>
          <p className="text-white/50 text-sm">AI costs (30d)</p>
        </div>

        {/* Profit */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-[#D4A017]" />
            <div className={`flex items-center gap-1 text-xs ${profitChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(profitChange).toFixed(1)}%
            </div>
          </div>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${profit.toFixed(2)}
          </p>
          <p className="text-white/50 text-sm">Net profit (30d)</p>
        </div>

        {/* Profit Margin */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-purple-400" />
          </div>
          <p className={`text-3xl font-bold ${profitMargin >= 50 ? 'text-green-400' : profitMargin >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
            {profitMargin.toFixed(1)}%
          </p>
          <p className="text-white/50 text-sm">Profit margin</p>
        </div>
      </div>

      {/* Revenue vs Costs Chart */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">Revenue vs Costs (14 days)</h2>
        <p className="text-white/40 text-sm mb-6">Green = Revenue, Red = AI Costs</p>
        
        <div className="flex items-end justify-between h-48 gap-1">
          {Object.entries(dailyData).map(([day, data]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-black border border-white/20 rounded px-2 py-1 text-xs whitespace-nowrap">
                  <p className="text-green-400">+${data.revenue.toFixed(2)}</p>
                  <p className="text-red-400">-${data.cost.toFixed(2)}</p>
                  <p className="text-white/50">{data.count} calls</p>
                </div>
              </div>
              
              {/* Bars container */}
              <div className="w-full flex gap-0.5 items-end" style={{ height: '140px' }}>
                {/* Revenue bar */}
                <div 
                  className="flex-1 bg-green-500/80 rounded-t transition-all hover:bg-green-400"
                  style={{ height: `${(data.revenue / maxDaily) * 100}%`, minHeight: data.revenue > 0 ? '2px' : '0' }}
                />
                {/* Cost bar */}
                <div 
                  className="flex-1 bg-red-500/80 rounded-t transition-all hover:bg-red-400"
                  style={{ height: `${(data.cost / maxDaily) * 100}%`, minHeight: data.cost > 0 ? '2px' : '0' }}
                />
              </div>
              <span className="text-white/40 text-[10px]">{day.split(' ')[1]}</span>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-white/50 text-sm">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-white/50 text-sm">AI Costs</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">User Plans</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">Free</p>
                <p className="text-white/50 text-sm">Limited access</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{profiles?.filter((p: any) => !getPlan(p) || getPlan(p) === 'free').length || 0}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border-l-4 border-green-500">
              <div>
                <p className="font-medium">Pro</p>
                <p className="text-white/50 text-sm">$12/listing</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{profiles?.filter((p: any) => getPlan(p) === 'pro').length || 0}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border-l-4 border-purple-500">
              <div>
                <p className="font-medium">Team</p>
                <p className="text-white/50 text-sm">$12/listing + base fee</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{profiles?.filter((p: any) => getPlan(p) === 'team').length || 0}</p>
              </div>
            </div>
          </div>
          <p className="text-white/40 text-sm mt-4">Note: Revenue is per-listing. Connect Stripe for accurate billing data.</p>
        </div>

        {/* Revenue Sources */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Sources (30d)</h2>
          <div className="space-y-4">
            {/* MRR */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white">Subscriptions (MRR)</span>
                <span className="text-green-400 font-medium">${mrr}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: totalRevenue30d > 0 ? `${(mrr / totalRevenue30d) * 100}%` : '0%' }}
                />
              </div>
            </div>
            
            {/* Human Edits */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-white">Human Edit Services</span>
                <span className="text-[#D4A017] font-medium">${humanEditRevenue.toFixed(2)}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#D4A017] rounded-full"
                  style={{ width: totalRevenue30d > 0 ? `${(humanEditRevenue / totalRevenue30d) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between">
                <span className="text-white font-semibold">Total Revenue</span>
                <span className="text-green-400 font-bold text-xl">${totalRevenue30d.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Unit Economics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{totalCreditsUsed}</p>
            <p className="text-white/50 text-sm">Credits Used (30d)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-400">
              ${totalCreditsUsed > 0 ? (totalAICost / totalCreditsUsed).toFixed(3) : '0'}
            </p>
            <p className="text-white/50 text-sm">Cost per Credit</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#D4A017]">
              ${totalPaidUsers > 0 ? (mrr / totalPaidUsers).toFixed(2) : '0'}
            </p>
            <p className="text-white/50 text-sm">ARPU (Avg Revenue/User)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              ${totalPaidUsers > 0 ? ((mrr - totalAICost) / totalPaidUsers).toFixed(2) : '0'}
            </p>
            <p className="text-white/50 text-sm">Profit per Paid User</p>
          </div>
        </div>
      </div>
    </div>
  );
}