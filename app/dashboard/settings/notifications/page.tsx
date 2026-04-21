'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Mail, MessageCircle, Moon, Save, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { normalizePhoneNumber } from '@/lib/phone';
import { mergeNotificationPreferences } from '@/lib/notifications/preferences';

type WeeklyDay = 'monday' | 'friday' | 'sunday';

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
    weeklyDay: 'monday' as WeeklyDay,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const supabase = createClient();

  const loadPreferences = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('phone, notification_preferences').eq('id', user.id).single();
    if (profile) {
      setPhone(profile.phone || '');
      if (profile.notification_preferences) setPrefs(prev => ({ ...prev, ...profile.notification_preferences }));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  const savePreferences = async () => {
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setSaveError('You need to be signed in to save notification settings.');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    const normalizedPhone = phone ? normalizePhoneNumber(phone) : null;
    if (phone && !normalizedPhone) {
      setSaving(false);
      setSaveError('Enter a valid phone number with country code, like +1 555 123 4567.');
      return;
    }

    const prefsToSave = {
      ...prefs,
      notificationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        phone: normalizedPhone,
        notification_preferences: mergeNotificationPreferences(
          (profile?.notification_preferences as Record<string, unknown> | null) ?? {},
          prefsToSave
        ),
      })
      .eq('id', user.id);

    if (error) {
      setSaving(false);
      setSaveError('Failed to save notification settings. Please try again.');
      return;
    }

    setPhone(normalizedPhone ?? '');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="min-h-screen bg-surface text-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-surface text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard/settings" className="text-white/50 hover:text-white text-sm">&larr; Back to Settings</Link>
          <h1 className="text-3xl font-bold mt-4 flex items-center gap-3"><Bell className="w-8 h-8 text-primary" />Notification Preferences</h1>
          <p className="text-white/50 mt-2">Control how and when SnapR contacts you</p>
        </div>

        {/* Channels */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Notification Channels</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-400" /><div><p className="font-medium">Email</p><p className="text-sm text-white/50">Receive notifications via email</p></div></div>
              <input type="checkbox" checked={prefs.email} onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })} className="w-5 h-5 accent-accent-gold" />
            </label>
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-sm text-white/50">Receive notifications via WhatsApp</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.whatsapp}
                onChange={(e) => setPrefs({ ...prefs, whatsapp: e.target.checked })}
                className="w-5 h-5 accent-accent-gold"
              />
            </label>
            {prefs.whatsapp && (
              <div className="ml-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-green-400 outline-none"
                />
                <p className="text-xs text-white/40 mt-2">Stored in E.164 format for internal alerts and manual outbound WhatsApp sends.</p>
                <p className="text-xs text-white/30 mt-1">Inbound WhatsApp replies are mapped to your SnapR user profile only for this launch.</p>
              </div>
            )}
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
                  <select value={prefs[item.key as keyof typeof prefs] as string} onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.value })} className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm">
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
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div>
                <p className="font-medium">Morning WhatsApp Briefing</p>
                <p className="text-sm text-white/50">Daily summary at your preferred time</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.dailyWhatsapp}
                onChange={(e) => setPrefs({ ...prefs, dailyWhatsapp: e.target.checked })}
                className="w-5 h-5 accent-accent-gold"
              />
            </label>
            {prefs.dailyWhatsapp && (
              <div className="ml-8 flex items-center gap-4">
                <span className="text-sm text-white/50">Delivery time:</span>
                <input
                  type="time"
                  value={prefs.dailyWhatsappTime}
                  onChange={(e) => setPrefs({ ...prefs, dailyWhatsappTime: e.target.value })}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg"
                />
              </div>
            )}
            <p className="text-xs text-white/30 ml-1">Quiet hours use your saved timezone from this browser.</p>
            <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
              <div><p className="font-medium">Weekly Email Report</p><p className="text-sm text-white/50">Performance summary and stats</p></div>
              <input type="checkbox" checked={prefs.weeklySummary} onChange={(e) => setPrefs({ ...prefs, weeklySummary: e.target.checked })} className="w-5 h-5 accent-accent-gold" />
            </label>
            {prefs.weeklySummary && (
              <div className="ml-8 flex items-center gap-4">
                <span className="text-sm text-white/50">Send on:</span>
                <select value={prefs.weeklyDay} onChange={(e) => setPrefs({ ...prefs, weeklyDay: e.target.value as WeeklyDay })} className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm">
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
            <input type="checkbox" checked={prefs.quietHoursEnabled} onChange={(e) => setPrefs({ ...prefs, quietHoursEnabled: e.target.checked })} className="w-5 h-5 accent-accent-gold" />
          </label>
          {prefs.quietHoursEnabled && (
            <div className="flex items-center gap-4 ml-4">
              <div><label className="text-sm text-white/50 block mb-1">From</label><input type="time" value={prefs.quietHoursStart} onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg" /></div>
              <div><label className="text-sm text-white/50 block mb-1">To</label><input type="time" value={prefs.quietHoursEnd} onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value })} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg" /></div>
            </div>
          )}
        </section>

        {saveError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {saveError}
          </div>
        )}

        <button onClick={savePreferences} disabled={saving} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold to-gold-dark rounded-xl text-black font-semibold disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <><CheckCircle className="w-5 h-5" />Saved!</> : <><Save className="w-5 h-5" />Save Preferences</>}
        </button>
      </div>
    </div>
  );
}
