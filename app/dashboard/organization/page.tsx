'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Loader2, Building2, Palette, Shield, Save, Upload,
  Check, AlertCircle, Eye, Copy, ExternalLink, Sparkles,
  Image as ImageIcon, Lock, ArrowLeft, Crown, Zap
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  platform_name: string | null;
  hide_powered_by: boolean;
  custom_login_message: string | null;
  custom_support_email: string | null;
  white_label_active: boolean;
  subscription_status: string;
}

interface UserPlan {
  plan: string;
  isTeam25: boolean;
  canAccessWhiteLabel: boolean;
  hasActiveSubscription: boolean;
}

const DEFAULT_COLORS = {
  primary: '#D4A017',
  secondary: '#1A1A1A',
  accent: '#B8860B',
};

export default function OrganizationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>({
    plan: 'free',
    isTeam25: false,
    canAccessWhiteLabel: false,
    hasActiveSubscription: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    platform_name: '',
    logo_url: '',
    primary_color: DEFAULT_COLORS.primary,
    secondary_color: DEFAULT_COLORS.secondary,
    accent_color: DEFAULT_COLORS.accent,
    hide_powered_by: false,
    custom_login_message: '',
    custom_support_email: '',
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's plan from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', user.id)
        .single();

      const plan = profile?.plan || 'free';
      const isPro = plan === 'pro';
      const isTeam = plan === 'team';
      // Check if Team 25 (highest tier gets free white-label)
      // This would need to check the actual subscription details
      const isTeam25 = false; // TODO: Check actual team size from Stripe
      
      setUserPlan({
        plan,
        isTeam25,
        canAccessWhiteLabel: isPro || isTeam,
        hasActiveSubscription: profile?.subscription_status === 'active',
      });

      // Check if user has an organization
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (existingOrg) {
        setOrg(existingOrg);
        setFormData({
          name: existingOrg.name || '',
          slug: existingOrg.slug || '',
          platform_name: existingOrg.platform_name || '',
          logo_url: existingOrg.logo_url || '',
          primary_color: existingOrg.primary_color || DEFAULT_COLORS.primary,
          secondary_color: existingOrg.secondary_color || DEFAULT_COLORS.secondary,
          accent_color: existingOrg.accent_color || DEFAULT_COLORS.accent,
          hide_powered_by: existingOrg.hide_powered_by || false,
          custom_login_message: existingOrg.custom_login_message || '',
          custom_support_email: existingOrg.custom_support_email || '',
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `org-logo-${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `organization-assets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('raw-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError('Failed to upload logo');
      return;
    }

    const { data: urlData } = supabase.storage
      .from('raw-images')
      .getPublicUrl(filePath);

    setFormData({ ...formData, logo_url: urlData.publicUrl });
    setSuccess('Logo uploaded!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: !org ? generateSlug(name) : formData.slug,
    });
  };

  const saveOrganization = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!formData.name || !formData.slug) {
        throw new Error('Organization name and URL slug are required');
      }

      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        throw new Error('URL slug can only contain lowercase letters, numbers, and hyphens');
      }

      const orgData = {
        name: formData.name,
        slug: formData.slug,
        platform_name: formData.platform_name || formData.name,
        logo_url: formData.logo_url || null,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        hide_powered_by: formData.hide_powered_by,
        custom_login_message: formData.custom_login_message || null,
        custom_support_email: formData.custom_support_email || null,
      };

      if (org) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', org.id);

        if (updateError) throw updateError;
        setSuccess('Settings saved!');
      } else {
        const { data: newOrg, error: insertError } = await supabase
          .from('organizations')
          .insert({
            ...orgData,
            owner_id: user.id,
            white_label_active: false,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.message.includes('duplicate')) {
            throw new Error('This URL slug is already taken');
          }
          throw insertError;
        }
        setOrg(newOrg);
        setSuccess('Organization created! Enable White-Label to go live.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnableWhiteLabel = async () => {
    if (!org) {
      setError('Please save your organization settings first');
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: org.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setCheckingOut(false);
    }
  };

  const copyUrl = () => {
    const url = `https://${formData.slug}.snap-r.com`;
    navigator.clipboard.writeText(url);
    setSuccess('URL copied!');
    setTimeout(() => setSuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Gate: Free users can't access
  if (userPlan.plan === 'free') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">White-Label Requires Pro or Team</h1>
            <p className="text-white/50 mb-6">
              Upgrade to a paid plan to unlock white-label branding for your business.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl hover:opacity-90"
            >
              <Zap className="w-5 h-5" />
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isWhiteLabelActive = org?.white_label_active;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings" className="p-2 bg-white/10 rounded-lg hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6 text-purple-400" />
                White-Label Settings
              </h1>
              <p className="text-white/50">Make SnapR yours with custom branding</p>
            </div>
          </div>

          {isWhiteLabelActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-green-400 font-medium">Active</span>
            </div>
          )}
        </div>

        {/* Status Banner */}
        {!isWhiteLabelActive && org && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  Enable White-Label
                </h3>
                <p className="text-white/60 mt-1">
                  Your branding settings are saved. Enable White-Label to go live!
                </p>
                <ul className="mt-3 space-y-1 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    Custom subdomain: {formData.slug}.snap-r.com
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    Your logo & colors on the platform
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    Remove all SnapR branding
                  </li>
                </ul>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-400">$99</div>
                <div className="text-sm text-white/50">/month</div>
                <button
                  onClick={handleEnableWhiteLabel}
                  disabled={checkingOut}
                  className="mt-3 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {checkingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {checkingOut ? 'Processing...' : 'Enable Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live URL Banner */}
        {isWhiteLabelActive && formData.slug && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/50">Your White-Label URL</div>
                <div className="font-mono text-lg">https://{formData.slug}.snap-r.com</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyUrl}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={`https://${formData.slug}.snap-r.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Organization Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Organization Details
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Organization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Smith Real Estate Group"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Platform Name (Replaces "SnapR")</label>
                <input
                  type="text"
                  value={formData.platform_name}
                  onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                  placeholder="Smith Media Studio"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/60 mb-2">URL Slug *</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/40">https://</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="smith-realty"
                    disabled={isWhiteLabelActive}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                  />
                  <span className="text-white/40">.snap-r.com</span>
                </div>
                {isWhiteLabelActive && (
                  <p className="text-xs text-white/40 mt-1">Subdomain cannot be changed once active. Contact support if needed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Logo
            </h2>

            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/5 cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => logoInputRef.current?.click()}
              >
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Upload className="w-8 h-8 text-white/30" />
                )}
              </div>
              <div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Upload Logo
                </button>
                <p className="text-xs text-white/40 mt-2">PNG or SVG, 200x200px recommended</p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Brand Colors
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Secondary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: formData.secondary_color }}>
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="" className="w-10 h-10 object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: formData.primary_color }} />
                )}
                <div>
                  <div className="font-bold" style={{ color: formData.primary_color }}>
                    {formData.platform_name || formData.name || 'Your Platform'}
                  </div>
                  <div className="text-sm" style={{ color: formData.accent_color }}>
                    Preview
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Options
            </h2>

            <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
              <div>
                <div className="font-medium">Hide "Powered by SnapR"</div>
                <div className="text-sm text-white/50">Remove all SnapR mentions</div>
              </div>
              <input
                type="checkbox"
                checked={formData.hide_powered_by}
                onChange={(e) => setFormData({ ...formData, hide_powered_by: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
              />
            </label>

            <div className="mt-4">
              <label className="block text-sm text-white/60 mb-2">Custom Login Message</label>
              <textarea
                value={formData.custom_login_message}
                onChange={(e) => setFormData({ ...formData, custom_login_message: e.target.value })}
                placeholder="Welcome to our media center. Contact support for access."
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-white/60 mb-2">Support Email</label>
              <input
                type="email"
                value={formData.custom_support_email}
                onChange={(e) => setFormData({ ...formData, custom_support_email: e.target.value })}
                placeholder="support@yourbusiness.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={saveOrganization}
            disabled={saving || !formData.name || !formData.slug}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {org ? 'Save Changes' : 'Create Organization'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
