'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, User, CreditCard, Mail, Camera, Shield, Bell, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile || { full_name: user.user_metadata?.full_name || '' });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    await supabase
      .from('profiles')
      .upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() });
    
    setSaving(false);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'billing', name: 'Plan & Billing', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className="h-16 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>

      <div className="max-w-5xl mx-auto p-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-60 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-[#D4A017]/20 to-transparent text-[#D4A017] border-l-2 border-[#D4A017]' 
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-2xl font-bold text-black">
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#D4A017] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl opacity-50"
                    />
                    <p className="text-xs text-white/40 mt-1">Contact support to change email</p>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Company</label>
                    <input
                      type="text"
                      value={profile?.company || ''}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#D4A017] outline-none"
                      placeholder="Your company name"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl font-medium text-black"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#D4A017]/10 to-transparent rounded-xl border border-[#D4A017]/30">
                  <div>
                    <p className="font-semibold text-[#D4A017]">Pay As You Go</p>
                    <p className="text-sm text-white/60">$1.50 per image</p>
                  </div>
                  <button className="px-4 py-2 bg-[#D4A017] text-black rounded-lg font-medium">
                    Upgrade
                  </button>
                </div>
              </div>

              {/* Credits */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Credits</h2>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-[#D4A017]">47</div>
                  <div className="text-white/60">credits remaining</div>
                </div>
                <button className="mt-4 px-4 py-2 border border-[#D4A017] text-[#D4A017] rounded-lg hover:bg-[#D4A017]/10">
                  Buy More Credits
                </button>
              </div>

              {/* Payment Method */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <p className="text-white/60">No payment method on file</p>
                <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">
                  Add Payment Method
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {['Email notifications for completed enhancements', 'Weekly usage summary', 'Product updates and tips'].map((item, i) => (
                  <label key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
                    <span>{item}</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#D4A017]" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-6">Security</h2>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">
                Change Password
              </button>
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                <button className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10">
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
