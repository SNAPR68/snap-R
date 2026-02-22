/**
 * Content Studio Screen
 * Hub for scheduled posts, published posts, and analytics summary.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useBillingGate } from '../../hooks/useBillingGate';

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduled_for: string;
  status: string;
  listing_title?: string;
}

interface PublishedPost {
  id: string;
  platform: string;
  content: string;
  published_at: string;
  likes: number;
  comments: number;
  shares: number;
}

interface ContentStats {
  scheduledCount: number;
  publishedCount: number;
  totalImpressions: number;
}

const TABS = ['Scheduled', 'Published'] as const;
type TabName = (typeof TABS)[number];

export default function ContentStudioScreen() {
  const { canAccessContentStudio, upgradeMessage } = useBillingGate();
  const [activeTab, setActiveTab] = useState<TabName>('Scheduled');
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [published, setPublished] = useState<PublishedPost[]>([]);
  const [stats, setStats] = useState<ContentStats>({
    scheduledCount: 0,
    publishedCount: 0,
    totalImpressions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!canAccessContentStudio) return;
    try {
      const [schedData, pubData, statsData] = await Promise.all([
        apiClient.getScheduledPosts(),
        apiClient.getPublishedPosts(),
        apiClient.getContentStats(),
      ]);
      setScheduled(schedData);
      setPublished(pubData);
      if (statsData) setStats(statsData);
    } catch {
      // Keep stale data
    } finally {
      setLoading(false);
    }
  }, [canAccessContentStudio]);

  useEffect(() => {
    if (!canAccessContentStudio) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, canAccessContentStudio]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getPlatformColor = (platform: string): string => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return '#1877F2';
      case 'instagram':
        return '#E4405F';
      case 'linkedin':
        return '#0A66C2';
      case 'tiktok':
        return '#00F2EA';
      default:
        return colors.textMuted;
    }
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  // Billing gate: block free-tier users from Content Studio
  if (!canAccessContentStudio) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.gateTitle}>Content Studio</Text>
        <Text style={styles.gateText}>{upgradeMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }
    >
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.scheduledCount}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.publishedCount}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.totalImpressions > 999
              ? `${(stats.totalImpressions / 1000).toFixed(1)}k`
              : stats.totalImpressions}
          </Text>
          <Text style={styles.statLabel}>Impressions</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Post List */}
      {activeTab === 'Scheduled' ? (
        scheduled.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No scheduled posts</Text>
            <Text style={styles.emptySubtext}>
              Prepare a listing to auto-generate social posts
            </Text>
          </View>
        ) : (
          scheduled.map(post => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View
                  style={[
                    styles.platformBadge,
                    { backgroundColor: `${getPlatformColor(post.platform)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.platformText,
                      { color: getPlatformColor(post.platform) },
                    ]}
                  >
                    {post.platform}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {formatDate(post.scheduled_for)}
                </Text>
              </View>
              <Text style={styles.postContent} numberOfLines={3}>
                {post.content}
              </Text>
              {post.listing_title && (
                <Text style={styles.listingRef}>{post.listing_title}</Text>
              )}
            </View>
          ))
        )
      ) : published.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No published posts yet</Text>
          <Text style={styles.emptySubtext}>
            Posts will appear here after publishing
          </Text>
        </View>
      ) : (
        published.map(post => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View
                style={[
                  styles.platformBadge,
                  { backgroundColor: `${getPlatformColor(post.platform)}20` },
                ]}
              >
                <Text
                  style={[
                    styles.platformText,
                    { color: getPlatformColor(post.platform) },
                  ]}
                >
                  {post.platform}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {formatDate(post.published_at)}
              </Text>
            </View>
            <Text style={styles.postContent} numberOfLines={3}>
              {post.content}
            </Text>
            <View style={styles.engagementRow}>
              <Text style={styles.engagementText}>{post.likes} likes</Text>
              <Text style={styles.engagementText}>
                {post.comments} comments
              </Text>
              <Text style={styles.engagementText}>{post.shares} shares</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: 2,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.gold,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  platformBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  platformText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  postContent: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  listingRef: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  engagementRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  engagementText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  gateTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  gateText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    lineHeight: 22,
  },
});
