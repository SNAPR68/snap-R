import Link from 'next/link';
import { ArrowLeft, User, Users, Building2 } from 'lucide-react';

export default function ChoosingPlanPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="h-14 bg-surface-container-low border-b border-white/10 flex items-center px-6">
        <Link href="/academy/plans-credits" className="flex items-center gap-2 text-on-surface-muted hover:text-on-surface">
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </Link>
      </header>
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">Choosing the Right Plan</h1>
        <p className="text-on-surface-muted mb-8">Find the perfect SnapR plan for your business.</p>
        
        {/* Free */}
        <div className="bg-surface-container-low border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-on-surface-muted" />
            <h2 className="text-xl font-bold">Free Plan</h2>
          </div>
          <p className="text-on-surface-muted mb-4">Best for: Trying SnapR, occasional users, single properties</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-400">Perfect if you:</h4>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                <li>• Handle 1-3 listings per month</li>
                <li>• Want to test the platform</li>
                <li>• Are just getting started</li>
                <li>• Don&apos;t mind watermarks</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">You get:</h4>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                <li>• 3 listings/month</li>
                <li>• All 15 AI tools</li>
                <li>• Basic content templates</li>
                <li>• Watermarked exports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pro */}
        <div className="bg-surface-container-low border-2 border-[#D4A017] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Pro Plan</h2>
            <span className="px-2 py-0.5 bg-[#D4A017] text-black text-xs font-bold rounded">RECOMMENDED</span>
          </div>
          <p className="text-on-surface-muted mb-4">Best for: Active agents, photographers, growing businesses</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-400">Perfect if you:</h4>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                <li>• Handle 10-75 listings per month</li>
                <li>• Need clean, professional exports</li>
                <li>• Want faster processing</li>
                <li>• Use social media marketing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">You get:</h4>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                <li>• Flexible listing volume</li>
                <li>• Priority 30-sec processing</li>
                <li>• Full Content Studio</li>
                <li>• WhatsApp client alerts</li>
                <li>• Clean HD exports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agency */}
        <div className="bg-surface-container-low border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Agency Plan</h2>
          </div>
          <p className="text-on-surface-muted mb-4">Best for: Brokerages, teams, high-volume businesses</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-400">Perfect if you:</h4>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                <li>• Have a team of agents</li>
                <li>• Handle 75+ listings per month</li>
                <li>• Need white-label branding</li>
                <li>• Want dedicated support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">You get:</h4>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                <li>• Unlimited listings</li>
                <li>• 5 team members</li>
                <li>• Instant processing</li>
                <li>• White-label option</li>
                <li>• Clean 4K exports</li>
                <li>• Priority phone support</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black font-semibold rounded-xl hover:bg-[#B8860B] transition-all">
            View Full Pricing
          </Link>
        </div>
      </main>
    </div>
  );
}
