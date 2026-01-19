import { adminSupabase } from '@/lib/supabase/admin';
import { TrendingUp, Users, DollarSign, Zap, Clock, Server, Wrench, Cpu, BarChart3, PieChart, Activity } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    { data: costs },
    { data: profiles },
    { data: events },
  ] = await Promise.all([
    adminSupabase().from('api_costs').select('*').gte('created_at', thirtyDaysAgo.toISOString()),
    adminSupabase().from('profiles').select('id, email, full_name, plan, created_at'),
    adminSupabase().from('analytics_events').select('*').gte('created_at', fourteenDaysAgo.toISOString()).order('created_at', { ascending: false }).limit(500),
  ]);

  // Cost aggregations
  const costByProvider: Record<string, { cost: number; count: number; time: number }> = {};
  const costByTool: Record<string, { cost: number; count: number }> = {};
  const costByUser: Record<string, { cost: number; count: number }> = {};
  const costByModel: Record<string, { cost: number; count: number }> = {};
  const dailyCosts: Record<string, { cost: number; count: number }> = {};
  
  let totalCostCents = 0;
  let totalCreditsCharged = 0;
  let totalTokens = 0;

  (costs || []).forEach((c: any) => {
    const provider = c.provider || 'unknown';
    const tool = c.tool_id || 'unknown';
    const model = c.model || 'unknown';
    const day = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!costByProvider[provider]) costByProvider[provider] = { cost: 0, count: 0, time: 0 };
    costByProvider[provider].cost += c.cost_cents || 0;
    costByProvider[provider].count += 1;
    costByProvider[provider].time += c.processing_time_ms || 0;

    if (!costByTool[tool]) costByTool[tool] = { cost: 0, count: 0 };
    costByTool[tool].cost += c.cost_cents || 0;
    costByTool[tool].count += 1;

    if (!costByUser[c.user_id]) costByUser[c.user_id] = { cost: 0, count: 0 };
    costByUser[c.user_id].cost += c.cost_cents || 0;
    costByUser[c.user_id].count += 1;

    if (!costByModel[model]) costByModel[model] = { cost: 0, count: 0 };
    costByModel[model].cost += c.cost_cents || 0;
    costByModel[model].count += 1;

    if (!dailyCosts[day]) dailyCosts[day] = { cost: 0, count: 0 };
    dailyCosts[day].cost += c.cost_cents || 0;
    dailyCosts[day].count += 1;

    totalCostCents += c.cost_cents || 0;
    totalCreditsCharged += c.credits_charged || 0;
    totalTokens += c.tokens_used || 0;
  });

  // User map for display
  const userMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => {
    userMap[p.id] = p.email || p.full_name || p.id.slice(0, 8);
  });

  // Sort helpers
  const sortedTools = Object.entries(costByTool).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  const sortedUsers = Object.entries(costByUser).sort((a, b) => b[1].cost - a[1].cost).slice(0, 10);
  const sortedModels = Object.entries(costByModel).sort((a, b) => b[1].cost - a[1].cost).slice(0, 10);

  // Daily chart data (last 14 days)
  const chartDays: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    chartDays.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  const maxDailyCost = Math.max(...chartDays.map(d => dailyCosts[d]?.cost || 0), 1);

  // Event analytics
  const eventsByType: Record<string, number> = {};
  const eventsByPage: Record<string, number> = {};
  const eventsByDevice: Record<string, number> = {};
  
  (events || []).forEach((e: any) => {
    eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1;
    if (e.event_type === 'page_view') {
      eventsByPage[e.event_name] = (eventsByPage[e.event_name] || 0) + 1;
    }
    if (e.device_type) {
      eventsByDevice[e.device_type] = (eventsByDevice[e.device_type] || 0) + 1;
    }
  });

  const providerColors: Record<string, string> = {
    runware: 'bg-blue-500',
    replicate: 'bg-purple-500',
    openai: 'bg-green-500',
    elevenlabs: 'bg-pink-500',
    unknown: 'bg-gray-500',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics & Costs</h1>
        <p className="text-white/50">AI usage, costs, and user analytics</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <DollarSign className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-3xl font-bold text-red-400">${(totalCostCents / 100).toFixed(2)}</p>
          <p className="text-white/50 text-sm">Total AI Cost (30d)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <Zap className="w-6 h-6 text-[#D4A017] mb-2" />
          <p className="text-3xl font-bold">{costs?.length || 0}</p>
          <p className="text-white/50 text-sm">API Calls</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <Activity className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-3xl font-bold">{totalCreditsCharged}</p>
          <p className="text-white/50 text-sm">Credits Charged</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <BarChart3 className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-3xl font-bold">${totalCreditsCharged > 0 ? ((totalCostCents / 100) / totalCreditsCharged).toFixed(3) : '0'}</p>
          <p className="text-white/50 text-sm">Cost per Credit</p>
        </div>
      </div>

      {/* Daily Cost Chart */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2">Daily Costs (14 days)</h2>
        <p className="text-white/40 text-sm mb-4">Hover for details</p>
        <div className="flex items-end justify-between h-48 gap-1">
          {chartDays.map((day) => {
            const data = dailyCosts[day] || { cost: 0, count: 0 };
            const height = (data.cost / maxDailyCost) * 100;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-black border border-white/20 rounded px-2 py-1 text-xs whitespace-nowrap">
                    <p className="text-white">${(data.cost / 100).toFixed(2)}</p>
                    <p className="text-white/50">{data.count} calls</p>
                  </div>
                </div>
                <div 
                  className="w-full bg-gradient-to-t from-[#D4A017] to-[#B8860B] rounded-t transition-all hover:opacity-80"
                  style={{ height: `${height}%`, minHeight: data.cost > 0 ? '4px' : '0' }}
                />
                <span className="text-white/40 text-[10px] truncate w-full text-center">{day.split(' ')[1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Provider & Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#D4A017]" />Cost by Provider
          </h2>
          {Object.keys(costByProvider).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(costByProvider).sort((a, b) => b[1].cost - a[1].cost).map(([provider, data]) => {
                const pct = totalCostCents > 0 ? (data.cost / totalCostCents) * 100 : 0;
                const avgTime = data.count > 0 ? (data.time / data.count / 1000).toFixed(1) : '0';
                return (
                  <div key={provider}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white capitalize">{provider}</span>
                      <span className="text-white/60">${(data.cost / 100).toFixed(2)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-1">
                      <div className={`h-full ${providerColors[provider] || providerColors.unknown} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{data.count} calls</span>
                      <span>~{avgTime}s avg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40">No data</p>
          )}
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#D4A017]" />Top Tools by Usage
          </h2>
          {sortedTools.length > 0 ? (
            <div className="space-y-3">
              {sortedTools.map(([tool, data], i) => {
                const pct = totalCostCents > 0 ? (data.cost / totalCostCents) * 100 : 0;
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#D4A017]/20 text-[#D4A017] text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-white text-sm capitalize">{tool.replace(/-/g, ' ')}</span>
                        <span className="text-white/50 text-sm">{data.count} uses</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full">
                        <div className="h-full bg-[#D4A017] rounded-full" style={{ width: `${(data.count / (sortedTools[0]?.[1]?.count || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-white/60 text-sm w-16 text-right">${(data.cost / 100).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40">No data</p>
          )}
        </div>
      </div>

      {/* Top Users by Cost */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D4A017]" />Top Users by Cost
        </h2>
        {sortedUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedUsers.map(([userId, data], i) => {
              const userName = userMap[userId] || userId.slice(0, 8) + '...';
              const pct = totalCostCents > 0 ? (data.cost / totalCostCents) * 100 : 0;
              return (
                <div key={userId} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-red-500 text-white' : 'bg-[#D4A017]/20 text-[#D4A017]'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate" title={userName}>{userName}</p>
                    <p className="text-white/40 text-xs">{data.count} calls</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${i === 0 ? 'text-red-400' : 'text-white'}`}>${(data.cost / 100).toFixed(2)}</p>
                    <p className="text-white/40 text-xs">{pct.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/40">No data</p>
        )}
      </div>

      {/* User Analytics */}
      {events && events.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Events by Type</h2>
            <div className="space-y-2">
              {Object.entries(eventsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-white/70 capitalize">{type.replace('_', ' ')}</span>
                  <span className="text-[#D4A017] font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Top Pages</h2>
            <div className="space-y-2">
              {Object.entries(eventsByPage).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([page, count]) => (
                <div key={page} className="flex justify-between items-center">
                  <span className="text-white/70 truncate" title={page}>{page}</span>
                  <span className="text-[#D4A017] font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Devices</h2>
            <div className="space-y-2">
              {Object.entries(eventsByDevice).sort((a, b) => b[1] - a[1]).map(([device, count]) => (
                <div key={device} className="flex justify-between items-center">
                  <span className="text-white/70 capitalize">{device}</span>
                  <span className="text-[#D4A017] font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
