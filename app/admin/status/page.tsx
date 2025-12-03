import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { CheckCircle, XCircle, AlertTriangle, Server, Database, Mail, CreditCard, Zap, Clock } from 'lucide-react';

async function checkService(name: string, checkFn: () => Promise<boolean>) {
  try {
    const start = Date.now();
    const ok = await checkFn();
    const latency = Date.now() - start;
    return { name, status: ok ? 'healthy' : 'unhealthy', latency };
  } catch {
    return { name, status: 'unhealthy', latency: 0 };
  }
}

export default async function AdminStatus() {
  const supabase = await createClient();

  // Check services
  const services = await Promise.all([
    checkService('Supabase Database', async () => {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    }),
    checkService('Supabase Storage', async () => {
      const { error } = await supabase.storage.from('raw-images').list('', { limit: 1 });
      return !error;
    }),
  ]);

  // Check env vars
  const envChecks = [
    { name: 'Stripe', configured: !!process.env.STRIPE_SECRET_KEY },
    { name: 'Resend Email', configured: !!process.env.RESEND_API_KEY },
    { name: 'Replicate AI', configured: !!process.env.REPLICATE_API_TOKEN },
    { name: 'Runware AI', configured: !!process.env.RUNWARE_API_KEY },
    { name: 'OpenAI', configured: !!process.env.OPENAI_API_KEY },
  ];

  // Get recent errors
  const { data: recentErrors } = await supabase
    .from('system_logs')
    .select('*')
    .in('level', ['error', 'critical'])
    .order('created_at', { ascending: false })
    .limit(5);

  // Get error count last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: errorCount24h } = await supabase
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .in('level', ['error', 'critical'])
    .gte('created_at', yesterday);

  // Get API success rate
  const { data: apiCosts } = await supabase
    .from('api_costs')
    .select('success')
    .gte('created_at', yesterday);
  
  const totalCalls = apiCosts?.length || 0;
  const successCalls = apiCosts?.filter(c => c.success).length || 0;
  const successRate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(1) : '100';

  const overallHealth = services.every(s => s.status === 'healthy') && 
    envChecks.every(e => e.configured) && 
    (errorCount24h || 0) < 10;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-white/50">Real-time health monitoring</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${overallHealth ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {overallHealth ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {overallHealth ? 'All Systems Operational' : 'Issues Detected'}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Errors (24h)
          </div>
          <p className={`text-3xl font-bold ${(errorCount24h || 0) > 5 ? 'text-red-400' : 'text-green-400'}`}>
            {errorCount24h || 0}
          </p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Zap className="w-4 h-4" />
            API Success Rate
          </div>
          <p className={`text-3xl font-bold ${Number(successRate) > 95 ? 'text-green-400' : 'text-orange-400'}`}>
            {successRate}%
          </p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Server className="w-4 h-4" />
            Services
          </div>
          <p className="text-3xl font-bold text-green-400">
            {services.filter(s => s.status === 'healthy').length}/{services.length}
          </p>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Clock className="w-4 h-4" />
            Avg Latency
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {Math.round(services.reduce((a, s) => a + s.latency, 0) / services.length)}ms
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#D4A017]" />
            Core Services
          </h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {service.status === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span>{service.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm ${service.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                    {service.status}
                  </span>
                  <span className="text-white/40 text-xs block">{service.latency}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Integrations */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#D4A017]" />
            API Integrations
          </h2>
          <div className="space-y-3">
            {envChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {check.configured ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span>{check.name}</span>
                </div>
                <span className={`text-sm ${check.configured ? 'text-green-400' : 'text-red-400'}`}>
                  {check.configured ? 'Connected' : 'Not Configured'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#D4A017]" />
            Recent Errors
          </h2>
          {recentErrors?.length ? (
            <div className="space-y-2">
              {recentErrors.map((err) => (
                <div key={err.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-400">{err.source}</span>
                    <span className="text-white/40 text-xs">
                      {new Date(err.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">{err.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-green-400">
              <CheckCircle className="w-8 h-8 mb-2" />
              <p>No recent errors</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
