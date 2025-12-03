import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';

export default async function AdminRevenue() {
  const supabase = await createClient();

  // Count paid plans
  const { data: profiles } = await supabase.from('profiles').select('plan');
  const paidPlans = {
    starter: profiles?.filter(p => p.plan === 'starter').length || 0,
    professional: profiles?.filter(p => p.plan === 'professional').length || 0,
    agency: profiles?.filter(p => p.plan === 'agency').length || 0,
  };

  // Calculate MRR
  const mrr = (paidPlans.starter * 29) + (paidPlans.professional * 79) + (paidPlans.agency * 199);

  // Human edit revenue
  const { data: humanEdits } = await supabase.from('human_edit_orders').select('amount_paid');
  const humanEditRevenue = humanEdits?.reduce((sum, order) => sum + (order.amount_paid || 0), 0) || 0;

  const stats = [
    { label: 'Monthly Recurring Revenue', value: `$${mrr}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Human Edit Revenue', value: `$${(humanEditRevenue / 100).toFixed(2)}`, icon: CreditCard, color: 'text-[#D4A017]' },
    { label: 'Paid Subscribers', value: paidPlans.starter + paidPlans.professional + paidPlans.agency, icon: Users, color: 'text-blue-400' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Revenue</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Subscription Breakdown */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Breakdown</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Starter Plan</p>
              <p className="text-white/50 text-sm">$29/month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{paidPlans.starter}</p>
              <p className="text-green-400">${paidPlans.starter * 29}/mo</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Professional Plan</p>
              <p className="text-white/50 text-sm">$79/month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{paidPlans.professional}</p>
              <p className="text-green-400">${paidPlans.professional * 79}/mo</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium">Agency Plan</p>
              <p className="text-white/50 text-sm">$199/month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{paidPlans.agency}</p>
              <p className="text-green-400">${paidPlans.agency * 199}/mo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
