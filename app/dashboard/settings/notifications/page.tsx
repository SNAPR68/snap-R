'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Mail, MessageCircle, Clock, Moon, Save, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phone, setPhone] = useState('');
  const [prefs, setPrefs] = useState({
    email: true,
    whatsapp: false,
    transactional: 'all' as 'all' | 'important' | 'none',
    clientEngagement: 'all' as 'all' | 'important' | 'none',
    socialUpdates: 'summary' as 'all' | 'summary' | 'none',
    alerts: 'all' as 'all' | 'critical',
    dailyWhatsapp: false,
    dailyWhatsappTime: '08:00',
    weeklySummary: true,
    weeklyDay: 'monday' as 'monday' | 'friday' | 'sunday',
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const supabase = createClient();

  useEffect(() => { loadPreferences(); }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('phone, notification_preferences').eq('id', user.id).single();
    if (profile) {
      setPhone(profile.phone || '');
      if (profile.notification_preferences) setPrefs(prev => ({ ...prev, ...profile.notification_preferences }));
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Ensure WhatsApp preferences are not saved (feature not available yet)
    const prefsToSave = { ...prefs, whatsapp: false, dailyWhatsapp: false };
    await supabase.from('profiles').update({ phone, notification_preferences: prefsToSave }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard/settings" className="text-white/50 hover:text-white text-sm">← Back to Settings</Link>
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-3"><Bell className="w-8 h-8 text-[#D4A017]" />Notification Preferences</h1>
          <p className="text-white/50 mt-2">Control how and when SnapR contacts you</p>
        </div>

        {/* Channels */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Notification Channels</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-400" /><div><p className="font-medium">Email</p><p className="text-sm text-white/50">Receive notifications via email</p></div></div>
              <input type="checkbox" checked={prefs.email} onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })} className="w-5 h-5 accent-[#D4A017]" />
            </label>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl opacity-60">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">WhatsApp</p>
                    <span className="px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full">Coming Soon</span>
                  </div>
                  <p className="text-sm text-white/50">Join waitlist - WhatsApp Business API approval pending</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={false} 
                disabled 
                className="w-5 h-5 accent-[#D4A017] opacity-50 cursor-not-allowed" 
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Notification Categories</h2>
          <div className="space-y-4">
            {[
              { key: 'transactional', label: 'Transactional', desc: 'Listing prepared, exports, human edits', options: ['all', 'important', 'none'] },
              { key: 'clientEngagement', label: 'Client Engagement', desc: 'Views, approvals, comments', options: ['all', 'important', 'none'] },
              { key: 'socialUpdates', label: 'Social Updates', desc: 'Posts, engagement stats', options: ['all', 'summary', 'none'] },
              { key: 'alerts', label: 'Alerts', desc: 'Credits, disconnections', options: ['all', 'critical'] },
            ].map(item => (
              <div key={item.key} className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{item.label}</p>
                  <select value={(prefs as any)[item.key]} onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.value })} className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm">
                    {item.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Digests */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Daily & Weekly Digests</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl opacity-60">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Morning WhatsApp Briefing</p>
                  <span className="px-2 py-0.5 text-xs bg-[#D4A017]/20 text-[#D4A017] rounded-full">Coming Soon</span>
                </div>
                <p className="text-sm text-white/50">Daily summary at your preferred time</p>
              </div>
              <input 
                type="checkbox" 
                checked={false} 
                disabled 
                className="w-5 h-5 accent-[#D4A017] opacity-50 cursor-not-allowed" 
              />
            </div>
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div><p className="font-medium">Weekly Email Report</p><p className="text-sm text-white/50">Performance summary and stats</p></div>
              <input type="checkbox" checked={prefs.weeklySummary} onChange={(e) => setPrefs({ ...prefs, weeklySummary: e.target.checked })} className="w-5 h-5 accent-[#D4A017]" />
            </label>
            {prefs.weeklySummary && (
              <div className="ml-8 flex items-center gap-4">
                <span className="text-sm text-white/50">Send on:</span>
                <select value={prefs.weeklyDay} onChange={(e) => setPrefs({ ...prefs, weeklyDay: e.target.value as any })} className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm">
                  <option value="monday">Monday</option><option value="friday">Friday</option><option value="sunday">Sunday</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Moon className="w-5 h-5" />Quiet Hours</h2>
          <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer mb-4">
            <div><p className="font-medium">Enable Quiet Hours</p><p className="text-sm text-white/50">Pause non-critical notifications</p></div>
            <input type="checkbox" checked={prefs.quietHoursEnabled} onChange={(e) => setPrefs({ ...prefs, quietHoursEnabled: e.target.checked })} className="w-5 h-5 accent-[#D4A017]" />
          </label>
          {prefs.quietHoursEnabled && (
            <div className="flex items-center gap-4 ml-4">
              <div><label className="text-sm text-white/50 block mb-1">From</label><input type="time" value={prefs.quietHoursStart} onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg" /></div>
              <div><label className="text-sm text-white/50 block mb-1">To</label><input type="time" value={prefs.quietHoursEnd} onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg" /></div>
            </div>
          )}
        </section>

        <button onClick={savePreferences} disabled={saving} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <><CheckCircle className="w-5 h-5" />Saved!</> : <><Save className="w-5 h-5" />Save Preferences</>}
        </button>
      </div>
    </div>
  );
}
