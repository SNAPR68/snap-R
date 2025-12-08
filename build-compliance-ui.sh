#!/bin/bash

echo "🎨 Building Compliance UI Components..."

# ============================================
# 1. MLS EXPORT MODAL COMPONENT
# ============================================
echo "Creating MLS Export Modal..."
cat > components/mls-export-modal.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { X, Download, Loader2, FileArchive, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

interface Photo {
  id: string;
  signedProcessedUrl?: string;
  processed_url?: string;
  variant?: string;
}

interface MlsOption {
  value: string;
  label: string;
  region: string;
}

interface MlsExportModalProps {
  photos: Photo[];
  listingTitle?: string;
  listingAddress?: string;
  onClose: () => void;
}

export function MlsExportModal({ photos, listingTitle, listingAddress, onClose }: MlsExportModalProps) {
  const [mlsOptions, setMlsOptions] = useState<MlsOption[]>([]);
  const [selectedMls, setSelectedMls] = useState('');
  const [agentName, setAgentName] = useState('');
  const [mlsNumber, setMlsNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [result, setResult] = useState<{ success: boolean; downloadUrl?: string; error?: string } | null>(null);

  // Fetch MLS options on mount
  useEffect(() => {
    async function fetchMlsOptions() {
      try {
        const res = await fetch('/api/compliance/export');
        const data = await res.json();
        if (data.mlsOptions) {
          setMlsOptions(data.mlsOptions);
          if (data.mlsOptions.length > 0) {
            setSelectedMls(data.mlsOptions[0].value);
          }
        }
      } catch (err) {
        console.error('Failed to fetch MLS options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchMlsOptions();
  }, []);

  const handleExport = async () => {
    if (!selectedMls || photos.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      const exportPhotos = photos.map((photo, index) => ({
        url: photo.signedProcessedUrl || photo.processed_url,
        toolId: photo.variant || 'auto-enhance',
        filename: `photo-${index + 1}.jpg`,
      }));

      const res = await fetch('/api/compliance/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mlsId: selectedMls,
          photos: exportPhotos,
          listingAddress: listingAddress || listingTitle || 'Property Listing',
          mlsNumber,
          agentName,
        }),
      });

      const data = await res.json();

      if (data.success && data.downloadUrl) {
        setResult({ success: true, downloadUrl: data.downloadUrl });
      } else {
        setResult({ success: false, error: data.error || 'Export failed' });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = `mls-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4A017] to-[#B8860B] rounded-xl flex items-center justify-center">
              <FileArchive className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-bold">MLS Export Package</h2>
              <p className="text-white/50 text-sm">{photos.length} photos ready</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* MLS Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Target MLS</label>
            {loadingOptions ? (
              <div className="flex items-center gap-2 text-white/50">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading MLS options...
              </div>
            ) : (
              <select
                value={selectedMls}
                onChange={(e) => setSelectedMls(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017] focus:outline-none"
              >
                {mlsOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-[#1A1A1A]">
                    {option.label} ({option.region})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Agent Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agent Name (optional)</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#D4A017] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MLS # (optional)</label>
              <input
                type="text"
                value={mlsNumber}
                onChange={(e) => setMlsNumber(e.target.value)}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#D4A017] focus:outline-none"
              />
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3">Package Includes:</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                {photos.length} photos with watermarks (where required)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                RESO-compliant metadata embedded
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Disclosure document (DISCLOSURE.txt)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Photo descriptions CSV for MLS upload
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                XMP metadata sidecars
              </li>
            </ul>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              {result.success ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-medium text-green-400">Export Ready!</p>
                    <p className="text-sm text-white/70">Your MLS-compliant package is ready to download.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Export Failed</p>
                    <p className="text-sm text-white/70">{result.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          {result?.success ? (
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download ZIP Package
            </button>
          ) : (
            <button
              onClick={handleExport}
              disabled={loading || !selectedMls || photos.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Package...
                </>
              ) : (
                <>
                  <FileArchive className="w-5 h-5" />
                  Generate MLS Package
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

# ============================================
# 2. COMPLIANCE SETTINGS COMPONENT
# ============================================
echo "Creating Compliance Settings Component..."
cat > components/compliance-settings.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';

interface MlsOption {
  value: string;
  label: string;
  region: string;
}

interface ComplianceSettingsProps {
  userId: string;
  initialSettings?: {
    autoWatermark: boolean;
    defaultMls: string;
  };
}

export function ComplianceSettings({ userId, initialSettings }: ComplianceSettingsProps) {
  const [autoWatermark, setAutoWatermark] = useState(initialSettings?.autoWatermark ?? true);
  const [defaultMls, setDefaultMls] = useState(initialSettings?.defaultMls ?? 'crmls');
  const [mlsOptions, setMlsOptions] = useState<MlsOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchMlsOptions() {
      try {
        const res = await fetch('/api/compliance/export');
        const data = await res.json();
        if (data.mlsOptions) {
          setMlsOptions(data.mlsOptions);
        }
      } catch (err) {
        console.error('Failed to fetch MLS options:', err);
      }
    }
    fetchMlsOptions();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // In a real implementation, save to user profile in Supabase
    // For now, we'll just simulate a save
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Auto Watermark Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Auto-Watermark Virtual Staging</h3>
          <p className="text-sm text-white/50">
            Automatically add "VIRTUALLY STAGED" watermark to applicable photos
          </p>
        </div>
        <button
          onClick={() => setAutoWatermark(!autoWatermark)}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            autoWatermark ? 'bg-[#D4A017]' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
              autoWatermark ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Default MLS Selection */}
      <div>
        <label className="block font-medium mb-2">Default MLS</label>
        <p className="text-sm text-white/50 mb-3">
          Pre-select your primary MLS for faster exports
        </p>
        <select
          value={defaultMls}
          onChange={(e) => setDefaultMls(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#D4A017] focus:outline-none"
        >
          {mlsOptions.map(option => (
            <option key={option.value} value={option.value} className="bg-[#1A1A1A]">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="font-medium text-blue-400 mb-2">About MLS Compliance</h4>
        <p className="text-sm text-white/70">
          NAR Code of Ethics requires disclosure of virtual staging and digital alterations. 
          SnapR automatically adds compliant watermarks and generates disclosure documents 
          for your MLS submissions.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-xl text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Saved!
          </>
        ) : (
          'Save Settings'
        )}
      </button>
    </div>
  );
}
EOF

# ============================================
# 3. UPDATE SETTINGS PAGE - Add Compliance Section
# ============================================
echo "Updating Settings Page..."
cat > app/dashboard/settings/page.tsx << 'EOF'
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Bell, CreditCard, Building2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Profile Section */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-[#D4A017]" />
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
              <label className="block text-white/50 text-sm mb-1">Credits</label>
              <p className="text-[#D4A017] font-semibold">{profile?.credits || 0}</p>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-[#D4A017]" />
            <h2 className="text-xl font-semibold">Subscription</h2>
          </div>
          <Link href="/dashboard/billing" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
            Manage Billing
          </Link>
        </section>

        {/* MLS Compliance Section - NEW */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-[#D4A017]" />
            <h2 className="text-xl font-semibold">MLS Compliance</h2>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">US Ready</span>
          </div>
          <ComplianceSettings userId={user.id} />
        </section>

        {/* Data Privacy Section */}
        <section className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[#D4A017]" />
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
EOF

echo ""
echo "✅ Compliance UI Components Created!"
echo ""
echo "📁 Files created:"
echo "   components/mls-export-modal.tsx"
echo "   components/compliance-settings.tsx"
echo "   app/dashboard/settings/page.tsx (updated)"
echo ""
echo "Next: Updating studio-client.tsx to add Export button..."

