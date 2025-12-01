'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Image, Clock, DollarSign, Zap, Calendar, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalPhotos: number;
  totalEnhancements: number;
  creditsUsed: number;
  creditsRemaining: number;
  subscriptionTier: string;
  timeSaved: number;
  moneySaved: number;
  enhancementsByType: { type: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

export function DashboardAnalytics({ userId }: { userId?: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError('Unable to load analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [userId]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#D4A017] animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-20 text-white/50">
        <p>{error || 'No data available'}</p>
      </div>
    );
  }

  const maxActivity = Math.max(...analytics.recentActivity.map((a) => a.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#D4A017]/20 to-[#D4A017]/5 rounded-xl p-4 border border-[#D4A017]/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#D4A017]/20 rounded-lg">
              <Image className="w-5 h-5 text-[#D4A017]" />
            </div>
            <span className="text-white/60 text-sm">Photos Enhanced</span>
          </div>
          <div className="text-3xl font-bold text-white">{analytics.totalEnhancements}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60 text-sm">Credits Left</span>
          </div>
          <div className="text-3xl font-bold text-white">{analytics.creditsRemaining}</div>
          <div className="text-xs text-white/40 mt-1 capitalize">{analytics.subscriptionTier} plan</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/60 text-sm">Time Saved</span>
          </div>
          <div className="text-3xl font-bold text-white">{formatTime(analytics.timeSaved)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">Money Saved</span>
          </div>
          <div className="text-3xl font-bold text-white">${analytics.moneySaved}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Weekly Activity</h3>
            <Calendar className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {analytics.recentActivity.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#D4A017] to-[#D4A017]/50 rounded-t-sm transition-all"
                  style={{ height: `${(day.count / maxActivity) * 100}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                ></div>
                <span className="text-white/40 text-xs">{day.date}</span>
              </div>
            ))}
          </div>
          {analytics.recentActivity.every((d) => d.count === 0) && (
            <p className="text-center text-white/30 text-sm mt-4">No activity this week</p>
          )}
        </div>

        {/* Enhancement Types */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Enhancements by Type</h3>
            <TrendingUp className="w-5 h-5 text-white/40" />
          </div>
          {analytics.enhancementsByType.length > 0 ? (
            <div className="space-y-3">
              {analytics.enhancementsByType.map((item, i) => {
                const maxCount = Math.max(...analytics.enhancementsByType.map((e) => e.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{item.type}</span>
                      <span className="text-white/50">{item.count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4A017] to-[#B8860B] rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-white/30 text-sm py-8">No enhancements yet</p>
          )}
        </div>
      </div>

      {/* Value Proposition */}
      {analytics.totalEnhancements > 0 && (
        <div className="bg-gradient-to-r from-[#D4A017]/10 to-transparent rounded-xl p-6 border border-[#D4A017]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4A017]/20 rounded-xl">
              <TrendingUp className="w-8 h-8 text-[#D4A017]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Your SnapR Impact</h3>
              <p className="text-white/60">
                You've saved <span className="text-[#D4A017] font-semibold">{formatTime(analytics.timeSaved)}</span> of editing time and{' '}
                <span className="text-[#D4A017] font-semibold">${analytics.moneySaved}</span> in outsourcing costs!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {analytics.totalEnhancements === 0 && (
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
          <Image className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No enhancements yet</h3>
          <p className="text-white/50 mb-4">Start enhancing your photos to see your analytics here</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#D4A017] text-black rounded-lg font-medium hover:bg-[#B8860B]"
          >
            <Zap className="w-4 h-4" /> Enhance Photos
          </a>
        </div>
      )}
    </div>
  );
}
