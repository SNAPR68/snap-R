'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2,
  Facebook,
  Instagram,
  Linkedin,
  Check,
  X,
  Link2,
  Unlink,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SocialPage {
  id: string;
  name: string;
  access_token: string;
}

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string;
  is_active: boolean;
  connected_at: string;
  pages?: SocialPage[];
  instagram_account?: { id: string; username: string };
  default_page_id?: string;
  last_error?: string | null;
}

interface SocialCapability {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'twitter';
  name: string;
  launchVisible: boolean;
  enabled: boolean;
  missing: string[];
}

const PLATFORM_META = {
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    description: 'Post directly to your Facebook Page.',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    description: 'Publish photos and carousels to Instagram Business.',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    description: 'Share polished listing content to LinkedIn.',
  },
} as const;

function SocialSettingsContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [capabilities, setCapabilities] = useState<SocialCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    void loadConnections();

    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      setMessage({ type: 'success', text: `Successfully connected to ${connected}.` });
      window.history.replaceState({}, '', '/dashboard/settings/social');
    } else if (error) {
      setMessage({ type: 'error', text: `Connection failed: ${error}` });
      window.history.replaceState({}, '', '/dashboard/settings/social');
    }
  }, [searchParams]);

  const launchPlatforms = useMemo(() => {
    const order = ['facebook', 'instagram', 'linkedin'];
    return capabilities
      .filter((capability) => capability.launchVisible)
      .sort((left, right) => order.indexOf(left.platform) - order.indexOf(right.platform));
  }, [capabilities]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social/connections', { signal: AbortSignal.timeout(15000) });
      const data = await response.json() as {
        connections?: SocialConnection[];
        capabilities?: SocialCapability[];
      };

      setConnections(data.connections ?? []);
      setCapabilities(data.capabilities ?? []);
    } catch {
      setMessage({ type: 'error', text: 'Unable to load social connection status.' });
    } finally {
      setLoading(false);
    }
  };

  const initiateOAuth = (platform: string, enabled: boolean) => {
    if (!enabled) {
      setMessage({ type: 'error', text: `${platform} is not configured for launch yet.` });
      return;
    }

    setConnecting(platform);
    window.location.href = `/api/social/connect/${platform}`;
  };

  const disconnectPlatform = async (platform: string, platformName: string) => {
    if (!confirm(`Disconnect ${platformName}? You'll need to reconnect to publish again.`)) return;

    try {
      const response = await fetch('/api/social', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', platform }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error('Disconnect failed');
      }

      setConnections((current) => current.filter((connection) => connection.platform !== platform));
      setMessage({ type: 'success', text: `Disconnected from ${platformName}.` });
    } catch {
      setMessage({ type: 'error', text: `Failed to disconnect ${platformName}.` });
    }
  };

  const getConnectionForPlatform = (platformId: string) => {
    return connections.find((connection) => connection.platform === platformId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
            <Link2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Social Connections</h1>
            <p className="text-white/50">Weekend launch supports Facebook, Instagram, and LinkedIn only.</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-medium text-amber-400">{connections.length} connected</span>
              <span className="text-white/50 ml-2">
                Only fully configured launch-ready platforms can be connected.
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {launchPlatforms.map((capability) => {
            const meta = PLATFORM_META[capability.platform as keyof typeof PLATFORM_META];
            const connection = getConnectionForPlatform(capability.platform);
            const Icon = meta.icon;
            const isConnecting = connecting === capability.platform;
            const missingLabel = capability.missing.join(', ');

            return (
              <div key={capability.platform} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: meta.color }} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{meta.name}</span>
                      {!capability.enabled && (
                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50">
                          Needs Config
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/50">
                      {connection
                        ? `Connected as @${connection.platform_username}`
                        : capability.enabled
                          ? meta.description
                          : `Missing config: ${missingLabel}`}
                    </div>
                    {connection?.last_error ? (
                      <p className="text-xs text-red-300 mt-1">Last error: {connection.last_error}</p>
                    ) : null}
                  </div>

                  {connection ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Connected
                      </span>
                      <button
                        onClick={() => disconnectPlatform(capability.platform, meta.name)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Disconnect"
                      >
                        <Unlink className="w-4 h-4 text-white/50" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => initiateOAuth(capability.platform, capability.enabled)}
                      disabled={isConnecting || !capability.enabled}
                      className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      Connect
                    </button>
                  )}
                </div>

                {connection && (capability.platform === 'facebook' || capability.platform === 'instagram') && connection.pages && connection.pages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="block text-sm text-white/60 mb-2">
                      Select Page to Post To
                    </label>
                    <select
                      value={connection.default_page_id || ''}
                      onChange={async (event) => {
                        const supabase = createClient();
                        await supabase
                          .from('social_connections')
                          .update({ default_page_id: event.target.value })
                          .eq('id', connection.id);
                        await loadConnections();
                      }}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="">Select a page...</option>
                      {connection.pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-bold mb-4">Launch Notes</h3>
          <ol className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">1</span>
              <span>Only Facebook, Instagram, and LinkedIn are enabled in the weekend launch surface.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">2</span>
              <span>Each connection uses the canonical SnapR OAuth callback flow and launch config gating.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">3</span>
              <span>Instagram requires a Business account linked to a Facebook Page with publishing permissions.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">4</span>
              <span>TikTok and X remain in the codebase, but they are intentionally hidden from the launch UI.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function SocialSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    }>
      <SocialSettingsContent />
    </Suspense>
  );
}
