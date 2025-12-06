import { createClient } from '@/lib/supabase/server';
import { DollarSign, TrendingUp, Server, Zap, Users, Clock, CheckCircle, XCircle, Cpu, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnalytics() {
  const supabase = await createClient();
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Fetch all cost data with user info
  const { data: costs } = await supabase
    .from('api_costs')
    .select('user_id, provider, tool_id, model, cost_cents, credits_charged, processing_time_ms, success, tokens_used, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  // Fetch user emails for display
  const userIds = [...new Set((costs || []).map((c: any) => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  const userMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => {
    userMap[p.id] = p.email || p.full_name || p.id.slice(0, 8);
  });

  // Calculate totals
  const totalCostCents = (costs || []).reduce((sum: number, c: any) => sum + (c.cost_cents || 0), 0);
  const totalCreditsCharged = (costs || []).reduce((sum: number, c: any) => sum + (c.credits_charged || 0), 0);
  const totalEnhancements = costs?.length || 0;
  const successfulCalls = (costs || []).filter((c: any) => c.success === true).length;
  const failedCalls = (costs || []).filter((c: any) => c.success === false).length;
  const successRate = totalEnhancements > 0 ? ((successfulCalls / totalEnhancements) * 100).toFixed(1) : '100';
  const avgProcessingTime = totalEnhancements > 0 
    ? Math.round((costs || []).reduce((sum: number, c: any) => sum + (c.processing_time_ms || 0), 0) / totalEnhancements)
    : 0;
  const totalTokens = (costs || []).reduce((sum: number, c: any) => sum + (c.tokens_used || 0), 0);

  // Group by USER
  const costByUser: Record<string, { cost: number; count: number; credits: number }> = {};
  (costs || []).forEach((c: any) => {
    const uid = c.user_id;
    if (!costByUser[uid]) costByUser[uid] = { cost: 0, count: 0, credits: 0 };
    costByUser[uid].cost += c.cost_cents || 0;
    costByUser[uid].count += 1;
    costByUser[uid].credits += c.credits_charged || 0;
  });
  const sortedUsers = Object.entries(costByUser)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10);

  // Group by PROVIDER
  const costByProvider: Record<string, { cost: number; count: number; time: number }> = {};
  (costs || []).forEach((c: any) => {
    const provider = c.provider || 'unknown';
    if (!costByProvider[provider]) costByProvider[provider] = { cost: 0, count: 0, time: 0 };
    costByProvider[provider].cost += c.cost_cents || 0;
    costByProvider[provider].count += 1;
    costByProvider[provider].time += c.processing_time_ms || 0;
  });

  // Group by TOOL
  const costByTool: Record<string, { cost: number; count: number; credits: number }> = {};
  (costs || []).forEach((c: any) => {
    const tool = c.tool_id || 'unknown';
    if (!costByTool[tool]) costByTool[tool] = { cost: 0, count: 0, credits: 0 };
    costByTool[tool].cost += c.cost_cents || 0;
    costByTool[tool].count += 1;
    costByTool[tool].credits += c.credits_charged || 0;
  });
  const sortedTools = Object.entries(costByTool).sort((a, b) => b[1].count - a[1].count);

  // Group by MODEL
  const costByModel: Record<string, { cost: number; count: number }> = {};
  (costs || []).forEach((c: any) => {
    const model = c.model || 'unknown';
    if (!costByModel[model]) costByModel[model] = { cost: 0, count: 0 };
    costByModel[model].cost += c.cost_cents || 0;
    costByModel[model].count += 1;
  });
  const sortedModels = Object.entries(costByModel).sort((a, b) => b[1].cost - a[1].cost).slice(0, 8);

  // Daily costs (last 14 days)
  const dailyCosts: Record<string, { cost: number; count: number }> = {};
  const recentCosts = (costs || []).filter((c: any) => new Date(c.created_at) >= fourteenDaysAgo);
  recentCosts.forEach((c: any) => {
    const day = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyCosts[day]) dailyCosts[day] = { cost: 0, count: 0 };
    dailyCosts[day].cost += c.cost_cents || 0;
    dailyCosts[day].count += 1;
  });

  // Provider colors
  const providerColors: Record<string, string> = {
    replicate: 'bg-blue-500',
    openai: 'bg-emerald-500',
    runware: 'bg-purple-500',
    unknown: 'bg-gray-500',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics & Costs</h1>
        <p className="text-white/50">Detailed cost monitoring and performance metrics</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold">${(totalCostCents / 100).toFixed(2)}</p>
          <p className="text-white/50 text-xs">Total Cost (30d)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Zap className="w-5 h-5 text-[#D4A017] mb-2" />
          <p className="text-2xl font-bold">{totalCreditsCharged}</p>
          <p className="text-white/50 text-xs">Credits Charged</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-2xl font-bold">{totalEnhancements}</p>
          <p className="text-white/50 text-xs">Enhancements</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold">{successRate}%</p>
          <p className="text-white/50 text-xs">Success Rate</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <Clock className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{(avgProcessingTime / 1000).toFixed(1)}s</p>
          <p className="text-white/50 text-xs">Avg Time</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold">{failedCalls}</p>
          <p className="text-white/50 text-xs">Failed Calls</p>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Daily Costs (14 days)</h2>
        <div className="flex items-end justify-between h-40 gap-1">
          {Object.keys(dailyCosts).length > 0 ? (
            Object.entries(dailyCosts).map(([day, data]) => {
              const maxCost = Math.max(...Object.values(dailyCosts).map(d => d.cost));
              const height = maxCost > 0 ? (data.cost / maxCost) * 100 : 0;
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
            })
          ) : (
            <p className="text-white/40 text-center w-full py-8">No data</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cost by Provider */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#D4A017]" />
            Cost by Provider
          </h2>
          {Object.keys(costByProvider).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(costByProvider)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([provider, data]) => {
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

        {/* Cost by Tool */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#D4A017]" />
            Cost by Tool
          </h2>
          {sortedTools.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {sortedTools.map(([tool, data], i) => {
                const pct = totalCostCents > 0 ? (data.cost / totalCostCents) * 100 : 0;
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-white text-sm capitalize">{tool.replace(/-/g, ' ')}</span>
                        <span className="text-white/50 text-sm">{data.count} uses</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4A017] rounded-full" style={{ width: `${pct}%` }} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by User - TOP USERS COSTING YOU */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4A017]" />
            Top Users by Cost
          </h2>
          {sortedUsers.length > 0 ? (
            <div className="space-y-3">
              {sortedUsers.map(([userId, data], i) => {
                const pct = totalCostCents > 0 ? (data.cost / totalCostCents) * 100 : 0;
                const userName = userMap[userId] || userId.slice(0, 8);
                return (
                  <div key={userId} className="flex items-center gap-3">
                    <span className={`text-sm w-5 ${i === 0 ? 'text-[#D4A017] font-bold' : 'text-white/40'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-white text-sm truncate" title={userName}>{userName}</span>
                        <span className="text-white/50 text-sm">{data.count} calls</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : 'bg-[#D4A017]'}`} style={{ width: `${pct}%` }} />
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

        {/* Cost by Model */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#D4A017]" />
            Cost by Model
          </h2>
          {sortedModels.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {sortedModels.map(([model, data], i) => {
                const pct = totalCostCents > 0 ? (data.cost / totalCostCents) * 100 : 0;
                const shortModel = model.split('/').pop() || model;
                return (
                  <div key={model} className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-white text-sm truncate" title={model}>{shortModel}</span>
                        <span className="text-white/50 text-sm">{data.count} calls</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
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

      {/* Credits vs Cost comparison */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Credits vs Actual Cost</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#D4A017]">{totalCreditsCharged}</p>
            <p className="text-white/50 text-sm">Credits Charged</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-400">${(totalCostCents / 100).toFixed(2)}</p>
            <p className="text-white/50 text-sm">Actual API Cost</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">
              ${totalCreditsCharged > 0 ? ((totalCostCents / 100) / totalCreditsCharged).toFixed(3) : '0'}
            </p>
            <p className="text-white/50 text-sm">Cost per Credit</p>
          </div>
        </div>
      </div>

      {/* OpenAI Token Usage */}
      {totalTokens > 0 && (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">OpenAI Token Usage</h2>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-emerald-400">{totalTokens.toLocaleString()}</p>
              <p className="text-white/50 text-sm">Total Tokens Used</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white/60">
                ${((totalTokens / 1000) * 0.002).toFixed(4)}
              </p>
              <p className="text-white/50 text-sm">Est. Token Cost (GPT-4)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}