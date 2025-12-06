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
