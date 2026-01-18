"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/providers/session-provider";
import {
  Copy,
  Download,
  ExternalLink,
  Zap,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  Video,
  Globe,
  ChevronRight,
  RefreshCw,
  Settings,
  BarChart3,
  Filter,
} from "lucide-react";
import Link from "next/link";

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  skipped: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const CONTENT_TYPE_ICONS: Record<string, any> = {
  social_post: Instagram,
  email: Mail,
  video: Video,
  property_site_update: Globe,
};

interface Campaign {
  id: string;
  trigger_status: string;
  status: string;
  total_items: number;
  completed_items: number;
  triggered_at: string;
  listings: {
    address: string;
    city: string;
    state: string;
    photos: { raw_url: string; processed_url?: string }[];
  };
  campaign_templates?: { name: string };
}

interface QueueItem {
  id: string;
  content_type: string;
  platform?: string;
  scheduled_for: string;
  status: string;
  content_data: any;
  preview_image_url?: string;
  listings: { address: string; city: string; state: string };
  campaigns: { trigger_status: string };
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  pendingApprovals: number;
  scheduledPosts: number;
  publishedPosts: number;
}

export default function CampaignsPage() {
  const { user } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "campaigns" | "history">("queue");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user?.id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch(`/api/campaigns?userId=${user?.id}&type=stats`);
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch campaigns
      const campaignsRes = await fetch(`/api/campaigns?userId=${user?.id}&type=campaigns`);
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.campaigns || []);

      // Fetch queue
      const queueRes = await fetch(`/api/campaigns?userId=${user?.id}&type=queue`);
      const queueData = await queueRes.json();
      setQueue(queueData.queue || []);
    } catch (error) {
      console.error("Failed to fetch campaign data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, data: any) => {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user?.id, ...data }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        alert(result.error || "Action failed");
      }
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days === -1) return "Yesterday";
    if (days > 0 && days < 7) return `In ${days} days`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#B8860B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-[#B8860B]" />
            Auto Campaigns
          </h1>
          <p className="text-gray-400 mt-1">Automated marketing when listing status changes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/campaigns/settings"
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] rounded-lg hover:border-[#B8860B] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Automation Settings
          </Link>
          <button
            onClick={fetchData}
            className="p-2 bg-[#1A1A1A] border border-[#333] rounded-lg hover:border-[#B8860B] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#333] rounded-xl p-4">
          <p className="text-gray-400 text-sm">Active Campaigns</p>
          <p className="text-3xl font-bold text-[#B8860B]">{stats?.activeCampaigns || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#333] rounded-xl p-4">
          <p className="text-gray-400 text-sm">Pending Approval</p>
          <p className="text-3xl font-bold text-yellow-400">{stats?.pendingApprovals || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#333] rounded-xl p-4">
          <p className="text-gray-400 text-sm">Scheduled</p>
          <p className="text-3xl font-bold text-blue-400">{stats?.scheduledPosts || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#333] rounded-xl p-4">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-3xl font-bold text-green-400">{stats?.publishedPosts || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#333] rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Campaigns</p>
          <p className="text-3xl font-bold text-white">{stats?.totalCampaigns || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-[#333]">
        {[
          { id: "queue", label: "Content Queue", count: queue.length },
          { id: "campaigns", label: "Campaigns", count: campaigns.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-2 border-b-2 transition-colors ${activeTab === tab.id
                ? "border-[#B8860B] text-[#B8860B]"
                : "border-transparent text-gray-400 hover:text-white"
              }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 bg-[#1A1A1A] rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Queue Tab */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-[#333]">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No scheduled content</p>
              <p className="text-gray-500 text-sm mt-1">
                Content will appear here when you change a listing status
              </p>
            </div>
          ) : (
            queue.map((item) => {
              const Icon = item.platform
                ? PLATFORM_ICONS[item.platform] || Globe
                : CONTENT_TYPE_ICONS[item.content_type] || Globe;

              return (
                <div
                  key={item.id}
                  className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 hover:border-[#B8860B]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Preview Image */}
                    {item.preview_image_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.preview_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-[#B8860B]" />
                        <span className="font-medium capitalize">
                          {item.platform || item.content_type.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[item.status]
                            }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[#B8860B]/20 text-[#B8860B] rounded-full">
                          {formatStatus(item.campaigns?.trigger_status || "")}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 truncate">
                        {item.listings?.address}, {item.listings?.city}
                      </p>

                      {item.content_data?.caption && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                          {item.content_data.caption}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.scheduled_for)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {item.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction("approve_item", { queueItemId: item.id })}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction("skip_item", { queueItemId: item.id })}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="Skip"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {item.status === "approved" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.content_data?.caption || "");
                              alert("Caption copied!");
                            }}
                            className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                            title="Copy Caption"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {item.content_data?.imageUrl && (
                            <a
                              href={item.content_data.imageUrl}
                              download={"post-" + item.platform + ".jpg"}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              title="Download Image"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              const urls = {
                                instagram: "https://www.instagram.com/",
                                facebook: "https://www.facebook.com/",
                                linkedin: "https://www.linkedin.com/feed/",
                                twitter: "https://twitter.com/compose/tweet",
                                tiktok: "https://www.tiktok.com/upload",
                              };
                              window.open(urls[item.platform as keyof typeof urls] || urls.instagram, "_blank");
                            }}
                            className="p-2 bg-[#D4A017]/20 text-[#D4A017] rounded-lg hover:bg-[#D4A017]/30 transition-colors"
                            title="Open Platform"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleAction("regenerate", { queueItemId: item.id })}
                        className="p-2 bg-[#333] text-gray-400 rounded-lg hover:bg-[#444] transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1A1A] rounded-xl border border-[#333]">
              <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No campaigns yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Campaigns are triggered when you change a listing status
              </p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 hover:border-[#B8860B]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Listing Photo */}
                  {campaign.listings?.photos?.[0] && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={
                          campaign.listings.photos[0].processed_url ||
                          campaign.listings.photos[0].raw_url
                        }
                        alt="Listing"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Campaign Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {formatStatus(campaign.trigger_status)} Campaign
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${campaign.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : campaign.status === "paused"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : campaign.status === "completed"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {campaign.listings?.address}, {campaign.listings?.city},{" "}
                      {campaign.listings?.state}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaign.completed_items}/{campaign.total_items} items completed •
                      Triggered {formatDate(campaign.triggered_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {campaign.status === "active" && (
                      <>
                        <button
                          onClick={() =>
                            handleAction("approve_all", { campaignId: campaign.id })
                          }
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                        >
                          Approve All
                        </button>
                        <button
                          onClick={() => handleAction("pause", { campaignId: campaign.id })}
                          className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {campaign.status === "paused" && (
                      <button
                        onClick={() => handleAction("resume", { campaignId: campaign.id })}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction("cancel", { campaignId: campaign.id })}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
