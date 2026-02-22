/**
 * Dashboard Screen
 * Command center showing listings, stats, and quick actions.
 * Fetches real data from the API.
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
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { DASHBOARD_REFRESH } from '../../constants/config';

interface DashboardStats {
  totalListings: number;
  totalPhotos: number;
  publishedPosts: number;
}

interface RecentListing {
  id: string;
  title: string;
  address: string | null;
  preparation_status: string | null;
  photo_count: number;
}

interface DashboardScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    totalPhotos: 0,
    publishedPosts: 0,
  });
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashData, listings] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getRecentListings(),
      ]);
      if (dashData) setStats(dashData);
      setRecentListings(listings);
    } catch {
      // Silently handle — show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, DASHBOARD_REFRESH);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'prepared':
      case 'marketed':
        return colors.success;
      case 'preparing':
      case 'processing':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.gold} />
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
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
        </Text>
        <Text style={styles.tierBadge}>
          {(profile?.subscription_tier ?? 'free').toUpperCase()}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalListings}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPhotos}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.publishedPosts}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
      </View>

      {/* Quick Action: Start Capture */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.captureButtonText}>Start AI Capture Session</Text>
        <Text style={styles.captureButtonSub}>
          Let AI guide you through photographing your property
        </Text>
      </TouchableOpacity>

      {/* Recent Listings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Listings</Text>
        {recentListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No listings yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first listing to get started
            </Text>
          </View>
        ) : (
          recentListings.map(listing => (
            <TouchableOpacity
              key={listing.id}
              style={styles.listingCard}
              onPress={() =>
                navigation.navigate('Listings', {
                  screen: 'ListingDetail',
                  params: { listingId: listing.id },
                })
              }
            >
              <View style={styles.listingCardHeader}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {listing.title}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(listing.preparation_status) },
                  ]}
                />
              </View>
              {listing.address && (
                <Text style={styles.listingAddress} numberOfLines={1}>
                  {listing.address}
                </Text>
              )}
              <View style={styles.listingMeta}>
                <Text style={styles.listingMetaText}>
                  {listing.photo_count} photos
                </Text>
                <Text style={styles.listingMetaText}>
                  {listing.preparation_status ?? 'pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  tierBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gold,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    letterSpacing: 1,
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
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statNumber: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  captureButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  captureButtonText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.background,
  },
  captureButtonSub: {
    fontSize: fontSize.sm,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  listingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listingAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  listingMetaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
});
