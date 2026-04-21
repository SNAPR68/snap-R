// components/listing-status-selector.tsx
// Marketing status selector – expects currentStatus = listing.marketing_status
"use client";

import { useState } from "react";
import { ChevronDown, Check, Zap, Loader2 } from "lucide-react";

const LISTING_STATUSES = [
  { value: "Coming Soon", color: "bg-purple-500" },
  { value: "Just Listed", color: "bg-green-500" },
  { value: "Active", color: "bg-blue-500" },
  { value: "Open House", color: "bg-orange-500" },
  { value: "Price Improvement", color: "bg-yellow-500" },
  { value: "Under Contract", color: "bg-pink-500" },
  { value: "Pending", color: "bg-indigo-500" },
  { value: "Sold", color: "bg-emerald-500" },
  { value: "Closed", color: "bg-gray-500" },
  { value: "Off Market", color: "bg-red-500" },
];

interface ListingStatusSelectorProps {
  listingId: string;
  userId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string, campaignTriggered: boolean) => void;
  compact?: boolean;
}

export function ListingStatusSelector({
  listingId,
  userId,
  currentStatus,
  onStatusChange,
  compact = false,
}: ListingStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [campaignNotification, setCampaignNotification] = useState<string | null>(null);

  const currentStatusConfig = LISTING_STATUSES.find((s) => s.value === status) || {
    value: status,
    color: "bg-gray-500",
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(false);

    try {
      const res = await fetch("/api/listings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          listingId,
          newStatus,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await res.json();

      if (result.success) {
        setStatus(newStatus);
        onStatusChange?.(newStatus, result.campaign?.triggered);

        if (result.campaign?.triggered) {
          setCampaignNotification("Campaign triggered!");
          setTimeout(() => setCampaignNotification(null), 3000);
        }
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (error: unknown) {
      console.error("Status change error:", error);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Current Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
        } rounded-lg border border-surface-border bg-surface-container-high hover:border-accent-gold/50 transition-colors`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${currentStatusConfig.color}`} />
        )}
        <span className="text-white">{status}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {/* Campaign Notification */}
      {campaignNotification && (
        <div className="absolute top-full left-0 mt-2 px-3 py-1.5 bg-accent-gold text-black text-xs rounded-lg flex items-center gap-1 whitespace-nowrap z-50 animate-pulse">
          <Zap className="w-3 h-3" />
          {campaignNotification}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-surface-container-high border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {LISTING_STATUSES.map((statusOption) => (
                <button
                  key={statusOption.value}
                  onClick={() => handleStatusChange(statusOption.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-raised transition-colors ${
                    status === statusOption.value ? "bg-surface-raised" : ""
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusOption.color}`} />
                  <span className="text-sm text-white flex-1">{statusOption.value}</span>
                  {status === statusOption.value && (
                    <Check className="w-4 h-4 text-accent-gold" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-surface border-t border-surface-border">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent-gold" />
                Campaigns auto-trigger on change
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
