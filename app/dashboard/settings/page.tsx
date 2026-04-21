import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Bell, CreditCard, Building2, Share2, Webhook, ChevronRight } from 'lucide-react';
import { DataPrivacyActions } from './data-actions';
import { ComplianceSettings } from '@/components/compliance-settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-charcoal-deep text-white">
      <header className="h-14 bg-surface-container-high border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile Section */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-white/50 text-sm mb-1">Name</label>
              <p className="text-white">{profile?.full_name || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-white/50 text-sm mb-1">Email</label>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-white/50 text-sm mb-1">Plan</label>
              <p className="text-white capitalize">{profile?.plan || 'Free'}</p>
            </div>
            <div>
              <label className="block text-white/50 text-sm mb-1">Region</label>
              <p className="text-white capitalize">{profile?.region || 'Not set'}</p>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Subscription</h2>
          </div>
          <Link href="/dashboard/billing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
            Manage Billing
          </Link>
        </section>

        {/* Social Connections */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Social Connections</h2>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Connect your Facebook, Instagram, and LinkedIn accounts to publish posts directly from SnapR.
          </p>
          <Link href="/dashboard/settings/social" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 text-sm">
            Manage Connections <ChevronRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Outgoing Webhooks */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Webhook className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Outgoing Webhooks</h2>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Send real-time events to Zapier, Make, or your own endpoints when listings, leads, and posts change.
          </p>
          <Link href="/dashboard/settings/webhooks" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 text-sm">
            Manage Webhooks <ChevronRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Notification Preferences */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Notification Preferences</h2>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Manage your email and WhatsApp notification settings, quiet hours, and daily briefings.
          </p>
          <Link href="/dashboard/settings/notifications" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 text-sm">
            Manage Notifications <ChevronRight className="w-4 h-4" />
          </Link>
        </section>

        {/* MLS Compliance Section */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">MLS Compliance</h2>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">US Ready</span>
          </div>
          <ComplianceSettings />
        </section>

        {/* Data Privacy Section */}
        <section className="bg-surface-container-high border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Data and Privacy</h2>
          </div>
          <p className="text-white/70 mb-6">
            Under GDPR and CCPA, you have the right to access, export, and delete your personal data.
          </p>
          <DataPrivacyActions userId={user.id} userEmail={user.email || ''} />
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-white/70 mb-4">Permanently delete your account and all data.</p>
          <DataPrivacyActions userId={user.id} userEmail={user.email || ''} deleteOnly />
        </section>
      </main>
    </div>
  );
}
