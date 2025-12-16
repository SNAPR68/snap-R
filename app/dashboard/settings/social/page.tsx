'use client';

import { useState, useEffect } from 'react';
import { Facebook, Instagram, Linkedin, Check, X, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string;
  platform_name: string;
  page_name?: string;
  connected_at: string;
  is_active: boolean;
}

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    description: 'Post to your Facebook Page',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    hoverColor: 'hover:opacity-90',
    description: 'Share to Instagram Business/Creator',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    hoverColor: 'hover:bg-blue-800',
    description: 'Publish to your LinkedIn profile',
  },
];

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/social/connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    try {
      const res = await fetch(`/api/social/connect/${platform}`);
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to initiate connection. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
    
    setDisconnecting(platform);
    try {
      await fetch(`/api/social/disconnect/${platform}`, { method: 'POST' });
      setConnections(prev => prev.filter(c => c.platform !== platform));
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setDisconnecting(null);
    }
  };

  const getConnection = (platform: string) => {
    return connections.find(c => c.platform === platform);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/settings" className="text-white/50 hover:text-white text-sm mb-2 inline-block">
            ← Back to Settings
          </Link>
          <h1 className="text-3xl font-bold mb-2">Social Media Connections</h1>
          <p className="text-white/60">Connect your social accounts to publish content directly from SnapR</p>
        </div>

        {/* Connection Cards */}
        <div className="space-y-4">
          {PLATFORMS.map(platform => {
            const connection = getConnection(platform.id);
            const Icon = platform.icon;
            const isConnected = !!connection?.is_active;

            return (
              <div
                key={platform.id}
                className={`bg-[#1A1A1A] border rounded-xl p-6 transition-all ${
                  isConnected ? 'border-emerald-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${platform.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        {platform.name}
                        {isConnected && (
                          <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Connected
                          </span>
                        )}
                      </h3>
                      <p className="text-white/50 text-sm">{platform.description}</p>
                      {isConnected && connection && (
                        <p className="text-white/40 text-xs mt-1">
                          {connection.page_name || connection.platform_name || connection.platform_username}
                          {' • '}Connected {new Date(connection.connected_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting === platform.id}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all"
                        >
                          <RefreshCw className={`w-4 h-4 ${connecting === platform.id ? 'animate-spin' : ''}`} />
                          Reconnect
                        </button>
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          disabled={disconnecting === platform.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all"
                        >
                          {disconnecting === platform.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={connecting === platform.id}
                        className={`flex items-center gap-2 px-6 py-2.5 ${platform.color} ${platform.hoverColor} rounded-lg font-medium transition-all`}
                      >
                        {connecting === platform.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                        Connect {platform.name}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-[#1A1A1A] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-3">How it works</h3>
          <ul className="space-y-2 text-white/60 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#D4A017]">1.</span>
              Connect your social media accounts using the buttons above
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A017]">2.</span>
              Create content in the Content Studio (posts, videos, carousels)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A017]">3.</span>
              Click "Publish" to post immediately or schedule for later
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A017]">4.</span>
              Enable Auto Campaigns to automatically post when listing status changes
            </li>
          </ul>
        </div>

        {/* Requirements Notice */}
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h4 className="font-medium text-amber-400 mb-2">Platform Requirements</h4>
          <ul className="space-y-1 text-white/60 text-sm">
            <li><strong>Facebook:</strong> Requires a Facebook Page (not personal profile)</li>
            <li><strong>Instagram:</strong> Requires Business or Creator account connected to Facebook Page</li>
            <li><strong>LinkedIn:</strong> Posts to your personal LinkedIn profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
