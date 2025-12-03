import { createClient } from '@/lib/supabase/server';
import { DollarSign, TrendingUp, Server, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnalytics() {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: costs } = await supabase.from('api_costs').select('*').gte('created_at', thirtyDaysAgo.toISOString());
  const { data: profiles } = await supabase.from('profiles').select('plan');
  const { data: humanEdits } = await supabase.from('human_edit_orders').select('amount_paid').gte('created_at', thirtyDaysAgo.toISOString());

  const costByProvider: Record<string, number> = {};
  (costs || []).forEach((cost: any) => {
    costByProvider[cost.provider] = (costByProvider[cost.provider] || 0) + cost.cost_cents;
  });

  const totalCostCents = Object.values(costByProvider).reduce((a, b) => a + b, 0);
  const totalCost = totalCostCents / 100;

  const starterCount = profiles?.filter((p: any) => p.plan === 'starter').length || 0;
  const proCount = profiles?.filter((p: any) => p.plan === 'professional').length || 0;
  const agencyCount = profiles?.filter((p: any) => p.plan === 'agency').length || 0;
  
  const mrr = (starterCount * 29) + (proCount * 79) + (agencyCount * 199);
  const humanEditRevenue = (humanEdits || []).reduce((sum: number, o: any) => sum + (o.amount_paid || 0), 0) / 100;
  const totalRevenue = mrr + humanEditRevenue;
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Analytics and Costs</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <DollarSign className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
          <p className="text-white/50 text-sm">Revenue (30d)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Server className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-3xl font-bold">${totalCost.toFixed(2)}</p>
          <p className="text-white/50 text-sm">AI Costs (30d)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <TrendingUp className="w-6 h-6 text-[#D4A017] mb-2" />
          <p className="text-3xl font-bold">{profitMargin}%</p>
          <p className="text-white/50 text-sm">Profit Margin</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <Zap className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-3xl font-bold">{costs?.length || 0}</p>
          <p className="text-white/50 text-sm">Enhancements</p>
        </div>
      </div>
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Cost by Provider</h2>
        {Object.keys(costByProvider).length === 0 ? (
          <p className="text-white/50">No cost data yet</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(costByProvider).map(([provider, cents]) => (
              <div key={provider} className="flex justify-between items-center">
                <span className="capitalize">{provider}</span>
                <span>${((cents as number) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
