'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2, Facebook, Instagram, Linkedin, Twitter, Music2,
  Check, X, Link2, Unlink, ExternalLink, AlertCircle, Settings,
  ChevronRight, Sparkles, RefreshCw
} from 'lucide-react';

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string;
  is_active: boolean;
  connected_at: string;
  pages?: any[];
  instagram_account?: any;
  default_page_id?: string;
}

const PLATFORMS = [
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook, 
    color: '#1877F2',
    description: 'Post to your Facebook Page',
    available: true,
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram, 
    color: '#E4405F',
    description: 'Share photos and reels to Instagram',
    available: true,
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin, 
    color: '#0A66C2',
    description: 'Share professional content',
    available: true,
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: Music2, 
    color: '#000000',
    description: 'Share videos to TikTok',
    available: false, // Coming soon
  },
  { 
    id: 'twitter', 
    name: 'X (Twitter)', 
    icon: Twitter, 
    color: '#000000',
    description: 'Tweet your listings',
    available: false, // Coming soon
  },
];

function SocialSettingsContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConnections();
    
    // Check for OAuth callback results
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    
    if (connected) {
      setMessage({ type: 'success', text: `Successfully connected to ${connected}!` });
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/settings/social');
    } else if (error) {
      setMessage({ type: 'error', text: `Connection failed: ${error}` });
      window.history.replaceState({}, '', '/dashboard/settings/social');
    }
  }, [searchParams]);

  const loadConnections = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (data) {
      setConnections(data);
    }
    setLoading(false);
  };

  const initiateOAuth = async (platform: string) => {
    setConnecting(platform);
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem(`oauth_state_${platform}`, state);

    // Redirect to OAuth initiation endpoint
    const baseUrl = window.location.origin;
    const redirectUri = `${baseUrl}/api/social/oauth/${platform}`;
    
    let authUrl = '';
    
    if (platform === 'facebook' || platform === 'instagram') {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      const scopes = platform === 'instagram' 
        ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
        : 'pages_show_list,pages_read_engagement,pages_manage_posts';
      
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
    } else if (platform === 'linkedin') {
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      const scopes = 'r_liteprofile%20r_emailaddress%20w_member_social';
      
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}`;
    }

    if (authUrl) {
      window.location.href = authUrl;
    } else {
      setConnecting(null);
      setMessage({ type: 'error', text: `${platform} connection not yet available` });
    }
  };

  const disconnectPlatform = async (connectionId: string, platform: string) => {
    if (!confirm(`Disconnect ${platform}? You'll need to reconnect to post again.`)) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('social_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (!error) {
      setConnections(connections.filter(c => c.id !== connectionId));
      setMessage({ type: 'success', text: `Disconnected from ${platform}` });
    }
  };

  const getConnectionForPlatform = (platformId: string) => {
    return connections.find(c => c.platform === platformId);
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
            <Link2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Social Connections</h1>
            <p className="text-white/50">Connect your social accounts to publish directly</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Connection Summary */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-medium text-amber-400">{connections.length} connected</span>
              <span className="text-white/50 ml-2">
                Connect your accounts to publish content with one click
              </span>
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const connection = getConnectionForPlatform(platform.id);
            const Icon = platform.icon;
            const isConnecting = connecting === platform.id;
            
            return (
              <div
                key={platform.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Platform Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: platform.color }} />
                  </div>

                  {/* Platform Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{platform.name}</span>
                      {!platform.available && (
                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-white/50">
                      {connection 
                        ? `Connected as @${connection.platform_username}`
                        : platform.description
                      }
                    </div>
                  </div>

                  {/* Action Button */}
                  {platform.available ? (
                    connection ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <Check className="w-4 h-4" />
                          Connected
                        </span>
                        <button
                          onClick={() => disconnectPlatform(connection.id, platform.name)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Disconnect"
                        >
                          <Unlink className="w-4 h-4 text-white/50" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => initiateOAuth(platform.id)}
                        disabled={isConnecting}
                        className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                        Connect
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-white/5 rounded-lg text-white/30 cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>

                {/* Facebook/Instagram Page Selection */}
                {connection && (platform.id === 'facebook' || platform.id === 'instagram') && connection.pages && connection.pages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="block text-sm text-white/60 mb-2">
                      Select Page to Post To
                    </label>
                    <select
                      value={connection.default_page_id || ''}
                      onChange={async (e) => {
                        const supabase = createClient();
                        await supabase
                          .from('social_connections')
                          .update({ default_page_id: e.target.value })
                          .eq('id', connection.id);
                        loadConnections();
                      }}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="">Select a page...</option>
                      {connection.pages.map((page: any) => (
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

        {/* Help Section */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-bold mb-4">How it Works</h3>
          <ol className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">1</span>
              <span>Connect your social accounts using the buttons above</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">2</span>
              <span>Create content in the Content Studio (posts, images, videos)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">3</span>
              <span>Click "Publish" to post directly to your connected accounts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold flex-shrink-0">4</span>
              <span>Or schedule posts to publish automatically at the best times</span>
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
