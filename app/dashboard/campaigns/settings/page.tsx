"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/providers/session-provider";
import {
  Zap,
  Settings,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  Video,
  Globe,
  ChevronLeft,
  Save,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import Link from "next/link";

const LISTING_STATUSES = {
  coming_soon: { label: "Coming Soon", description: "Build anticipation before listing goes live" },
  just_listed: { label: "Just Listed", description: "Full marketing push for new listings" },
  open_house: { label: "Open House", description: "Drive attendance to open house events" },
  price_drop: { label: "Price Improvement", description: "Announce price reductions" },
  under_contract: { label: "Under Contract", description: "Show market activity" },
  sold: { label: "Sold", description: "Celebrate and generate referrals" },
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
];

interface Trigger {
  id?: string;
  trigger_status: string;
  is_active: boolean;
  auto_approve: boolean;
  generate_social: boolean;
  generate_email: boolean;
  generate_video: boolean;
  update_property_site: boolean;
  platforms: string[];
  template_id?: string;
  campaign_templates?: { name: string };
}

export default function CampaignSettingsPage() {
  const { user } = useSession();
  const [triggers, setTriggers] = useState<Record<string, Trigger>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);
  // Initialize with defaults if no user
  useEffect(() => {
    if (!user?.id && !loading) {
      const defaultTriggers: Record<string, Trigger> = {};
      for (const status of Object.keys(LISTING_STATUSES)) {
        defaultTriggers[status] = {
          trigger_status: status,
          is_active: false,
          auto_approve: false,
          generate_social: true,
          generate_email: true,
          generate_video: false,
          update_property_site: true,
          platforms: ["instagram", "facebook", "linkedin"],
        };
      }
      setTriggers(defaultTriggers);
    }
  }, [user?.id, loading]);
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's triggers
      const triggersRes = await fetch(`/api/campaigns?userId=${user?.id}&type=triggers`);
      const triggersData = await triggersRes.json();

      // Fetch available templates
      const templatesRes = await fetch(`/api/campaigns?userId=${user?.id}&type=templates`);
      const templatesData = await templatesRes.json();

      setTemplates(templatesData.templates || []);

      // Convert triggers array to object keyed by status
      const triggersMap: Record<string, Trigger> = {};
      for (const status of Object.keys(LISTING_STATUSES)) {
        const existingTrigger = triggersData.triggers?.find(
          (t: Trigger) => t.trigger_status === status
        );
        triggersMap[status] = existingTrigger || {
          trigger_status: status,
          is_active: false,
          auto_approve: false,
          generate_social: true,
          generate_email: true,
          generate_video: false,
          update_property_site: true,
          platforms: ["instagram", "facebook", "linkedin"],
        };
      }
      setTriggers(triggersMap);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTrigger = (status: string, updates: Partial<Trigger>) => {
    setTriggers((prev) => ({
      ...prev,
      [status]: { ...prev[status], ...updates },
    }));
  };

  const togglePlatform = (status: string, platform: string) => {
    const currentPlatforms = triggers[status]?.platforms || [];
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter((p) => p !== platform)
      : [...currentPlatforms, platform];
    updateTrigger(status, { platforms: newPlatforms });
  };

  const saveTrigger = async (status: string) => {
    setSaving(status);
    try {
      const trigger = triggers[status];
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_trigger",
          userId: user?.id,
          triggerStatus: status,
          settings: {
            is_active: trigger.is_active,
            auto_approve: trigger.auto_approve,
            generate_social: trigger.generate_social,
            generate_email: trigger.generate_email,
            generate_video: trigger.generate_video,
            update_property_site: trigger.update_property_site,
            platforms: trigger.platforms,
            template_id: trigger.template_id,
          },
        }),
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(null);
    }
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
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/campaigns"
          className="p-2 bg-[#1A1A1A] border border-[#333] rounded-lg hover:border-[#B8860B] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#B8860B]" />
            Automation Settings
          </h1>
          <p className="text-gray-400 mt-1">
            Configure what happens when you change a listing status
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#B8860B]/10 border border-[#B8860B]/30 rounded-xl p-4 mb-8 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#B8860B] flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-[#B8860B] font-medium">How it works</p>
          <p className="text-gray-300 mt-1">
            When you change a listing&apos;s status, SnapR automatically generates marketing
            content based on your settings below. Content goes to your approval queue unless
            you enable auto-approve.
          </p>
        </div>
      </div>

      {/* Status Triggers */}
      <div className="space-y-6">
        {Object.entries(LISTING_STATUSES).map(([status, info]) => {
          const trigger = triggers[status];
          if (!trigger) return null;

          return (
            <div
              key={status}
              className={`bg-[#1A1A1A] border rounded-xl overflow-hidden transition-colors ${trigger.is_active ? "border-[#B8860B]/50" : "border-[#333]"
                }`}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-[#333]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateTrigger(status, { is_active: !trigger.is_active })}
                    className="text-[#B8860B]"
                  >
                    {trigger.is_active ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-500" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold text-lg">{info.label}</h3>
                    <p className="text-sm text-gray-400">{info.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => saveTrigger(status)}
                  disabled={saving === status}
                  className="flex items-center gap-2 px-4 py-2 bg-[#B8860B] text-black rounded-lg hover:bg-[#D4A84B] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving === status ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Settings */}
              <div className={`p-4 space-y-4 ${!trigger.is_active ? "opacity-50" : ""}`}>
                {/* What to Generate */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">Generate:</p>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trigger.generate_social}
                        onChange={(e) =>
                          updateTrigger(status, { generate_social: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-[#B8860B] focus:ring-[#B8860B]"
                      />
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span className="text-sm">Social Posts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trigger.generate_email}
                        onChange={(e) =>
                          updateTrigger(status, { generate_email: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-[#B8860B] focus:ring-[#B8860B]"
                      />
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Email Blast</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trigger.update_property_site}
                        onChange={(e) =>
                          updateTrigger(status, { update_property_site: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-[#B8860B] focus:ring-[#B8860B]"
                      />
                      <Globe className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Update Property Site</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trigger.generate_video}
                        onChange={(e) =>
                          updateTrigger(status, { generate_video: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-[#B8860B] focus:ring-[#B8860B]"
                      />
                      <Video className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">Video</span>
                    </label>
                  </div>
                </div>

                {/* Platforms */}
                {trigger.generate_social && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-3">Post to:</p>
                    <div className="flex gap-2">
                      {PLATFORMS.map((platform) => {
                        const Icon = platform.icon;
                        const isActive = trigger.platforms?.includes(platform.id);
                        return (
                          <button
                            key={platform.id}
                            onClick={() => togglePlatform(status, platform.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isActive
                              ? "bg-[#B8860B]/20 border-[#B8860B] text-[#B8860B]"
                              : "bg-[#0D0D0D] border-[#333] text-gray-400 hover:border-[#B8860B]/50"
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{platform.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Auto Approve */}
                <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                  <div>
                    <p className="text-sm font-medium">Auto-approve content</p>
                    <p className="text-xs text-gray-500">
                      Skip approval queue and publish automatically
                    </p>
                  </div>
                  <button
                    onClick={() => updateTrigger(status, { auto_approve: !trigger.auto_approve })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${trigger.auto_approve ? "bg-[#B8860B]" : "bg-[#333]"
                      }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${trigger.auto_approve ? "translate-x-7" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
