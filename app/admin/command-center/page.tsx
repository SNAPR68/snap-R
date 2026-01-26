import { adminSupabase } from '@/lib/supabase/admin';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, DollarSign, 
  Globe, Server, Users, Zap, TrendingUp, Eye 
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function CommandCenter() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { data: profiles },
    { data: todayCosts },
    { data: recentErrors },
    { data: recentActivity },
    { data: listings },
    { data: humanEdits },
  ] = await Promise.all([
    adminSupabase().from('profiles').select('id, plan, created_at'),
    adminSupabase().from('api_costs').select('cost_cents, provider, created_at').gte('created_at', today.toISOString()),
    adminSupabase().from('error_logs').select('id, severity, message, created_at').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
    adminSupabase().from('analytics_events').select('event_type, user_id, created_at').gte('created_at', oneHourAgo.toISOString()),
    adminSupabase().from('listings').select('id, status, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
    adminSupabase().from('human_edit_orders').select('amount_paid, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
  ]);

  const activeUsersLastHour = new Set(recentActivity?.map((a: any) => a.user_id)).size;
  const pageViewsLastHour = recentActivity?.filter((a: any) => a.event_type === 'page_view').length || 0;
  const todaySpend = (todayCosts || []).reduce((sum: number, c: any) => sum + (c.cost_cents || 0), 0) / 100;
  const todayEnhancements = todayCosts?.length || 0;
  const criticalErrors = recentErrors?.filter((e: any) => e.severity === 'critical').length || 0;
  const totalErrors = recentErrors?.length || 0;
  const monthlyRevenue = (humanEdits || []).reduce((sum: number, o: any) => sum + (o.amount_paid || 0), 0) / 100;
  const proUsers = profiles?.filter((p: any) => p.plan === 'pro' || p.plan === 'team').length || 0;
  const systemStatus = criticalErrors > 0 ? 'critical' : totalErrors > 0 ? 'warning' : 'healthy';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-white/50">Live system overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${systemStatus === 'healthy' ? 'bg-green-500' : systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-white/60">
            {systemStatus === 'healthy' ? 'All Systems Operational' : systemStatus === 'warning' ? 'Minor Issues' : 'Critical Alert'}
          </span>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${systemStatus === 'healthy' ? 'bg-green-500/10 border-green-500/30' : systemStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30 animate-pulse'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {systemStatus === 'healthy' ? <CheckCircle className="w-6 h-6 text-green-400" /> : <AlertTriangle className={`w-6 h-6 ${systemStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />}
            <div>
              <p className="font-medium">
                {systemStatus === 'healthy' ? 'All systems running smoothly' : systemStatus === 'warning' ? `${totalErrors} unresolved error(s)` : `${criticalErrors} CRITICAL error(s) need attention`}
              </p>
              <p className="text-sm text-white/50">Last checked: {now.toLocaleTimeString()}</p>
            </div>
          </div>
          {totalErrors > 0 && <Link href="/admin/logs" className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition text-sm">View Errors</Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400 animate-pulse">LIVE</span>
          </div>
          <p className="text-3xl font-bold">{activeUsersLastHour}</p>
          <p className="text-white/40 text-sm">Active Users (1hr)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{pageViewsLastHour}</p>
          <p className="text-white/40 text-sm">Page Views (1hr)</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{todayEnhancements}</p>
          <p className="text-white/40 text-sm">Enhancements Today</p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">${todaySpend.toFixed(2)}</p>
          <p className="text-white/40 text-sm">AI Spend Today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Recent Errors
            </h2>
            <Link href="/admin/logs" className="text-sm text-[#D4A017] hover:underline">View all</Link>
          </div>
          {recentErrors && recentErrors.length > 0 ? (
            <div className="space-y-3">
              {recentErrors.map((error: any) => (
                <div key={error.id} className={`p-3 rounded-lg border ${error.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${error.severity === 'critical' ? 'bg-red-500/30 text-red-400' : 'bg-yellow-500/30 text-yellow-400'}`}>{error.severity}</span>
                    <span className="text-xs text-white/40">{new Date(error.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-white/80 truncate">{error.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              No unresolved errors
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Business Health (30d)
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>Revenue</span>
              </div>
              <span className="font-bold text-green-400">${monthlyRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Paid Users</span>
              </div>
              <span className="font-bold text-purple-400">{proUsers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <span>New Listings</span>
              </div>
              <span className="font-bold text-blue-400">{listings?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">External Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Supabase', 'Replicate', 'OpenAI', 'Stripe'].map((service) => (
            <div key={service} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">{service}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Full Analytics', href: '/admin/analytics', icon: TrendingUp },
          { label: 'User Management', href: '/admin/users', icon: Users },
          { label: 'Error Logs', href: '/admin/logs', icon: Server },
          { label: 'Revenue Details', href: '/admin/revenue', icon: DollarSign },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center gap-3 p-4 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-[#D4A017]/50 transition">
            <link.icon className="w-5 h-5 text-[#D4A017]" />
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
