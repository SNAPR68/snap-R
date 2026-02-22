/**
 * Listing Detail Screen
 * Shows listing info, photos, preparation/marketing status, and actions.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { apiClient } from '../../lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { POLL_PREPARATION_STATUS } from '../../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

interface ListingDetail {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  preparation_status: string | null;
  marketing_status: string | null;
  hero_photo_id: string | null;
  created_at: string;
}

interface PhotoItem {
  id: string;
  raw_url: string | null;
  processed_url: string | null;
  status: string;
  variant: string;
  signed_url?: string;
}

interface ListingDetailScreenProps {
  route: {
    params: { listingId: string };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function ListingDetailScreen({
  route,
  navigation,
}: ListingDetailScreenProps) {
  const { listingId } = route.params;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [listingData, photosData] = await Promise.all([
        apiClient.getListingDetail(listingId),
        apiClient.getListingPhotos(listingId),
      ]);
      if (listingData) setListing(listingData);
      setPhotos(photosData);
    } catch {
      // Keep stale data
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll while preparing
  useEffect(() => {
    if (listing?.preparation_status !== 'preparing') return;
    const interval = setInterval(fetchData, POLL_PREPARATION_STATUS);
    return () => clearInterval(interval);
  }, [listing?.preparation_status, fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handlePrepare = async () => {
    setPreparing(true);
    try {
      await apiClient.prepareListing(listingId);
      await fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start preparation';
      Alert.alert('Error', message);
    } finally {
      setPreparing(false);
    }
  };

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'prepared':
      case 'completed':
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

  if (!listing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const enhancedPhotos = photos.filter(p => p.processed_url);
  const canPrepare =
    photos.length > 0 &&
    listing.preparation_status !== 'preparing' &&
    listing.preparation_status !== 'prepared';

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
      {/* Header */}
      <Text style={styles.title}>{listing.title}</Text>
      {listing.address && (
        <Text style={styles.address}>
          {listing.address}
          {listing.city ? `, ${listing.city}` : ''}
          {listing.state ? `, ${listing.state}` : ''}
          {listing.zip ? ` ${listing.zip}` : ''}
        </Text>
      )}

      {/* Status Badges */}
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Preparation</Text>
          <Text
            style={[
              styles.statusValue,
              { color: getStatusColor(listing.preparation_status) },
            ]}
          >
            {listing.preparation_status ?? 'Pending'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Marketing</Text>
          <Text
            style={[
              styles.statusValue,
              { color: getStatusColor(listing.marketing_status) },
            ]}
          >
            {listing.marketing_status ?? 'Pending'}
          </Text>
        </View>
      </View>

      {/* Processing Banner */}
      {listing.preparation_status === 'preparing' && (
        <View style={styles.processingBanner}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={styles.processingText}>
            AI is enhancing your photos...
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        {canPrepare && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePrepare}
            disabled={preparing}
          >
            {preparing ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.actionButtonText}>Prepare Listing</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={() =>
            navigation.navigate('Camera', {
              screen: 'AiDirector',
              params: { listingId },
            })
          }
        >
          <Text style={styles.actionButtonSecondaryText}>Add Photos</Text>
        </TouchableOpacity>
      </View>

      {/* Photos Grid */}
      <Text style={styles.sectionTitle}>
        Photos ({photos.length})
        {enhancedPhotos.length > 0 && (
          <Text style={styles.enhancedCount}>
            {' '}{enhancedPhotos.length} enhanced
          </Text>
        )}
      </Text>

      {photos.length === 0 ? (
        <View style={styles.emptyPhotos}>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>
            Use AI Director to capture professional photos
          </Text>
        </View>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map(photo => (
            <View key={photo.id} style={styles.photoItem}>
              <Image
                source={{ uri: photo.signed_url ?? photo.processed_url ?? photo.raw_url ?? undefined }}
                style={styles.photoImage}
                alt={`Listing photo ${photo.id}`}
              />
              {photo.processed_url && (
                <View style={styles.enhancedBadge}>
                  <Text style={styles.enhancedBadgeText}>Enhanced</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Marketing Results Link */}
      {listing.marketing_status === 'completed' && (
        <TouchableOpacity
          style={styles.marketingLink}
          onPress={() =>
            navigation.navigate('MarketingResults', { listingId })
          }
        >
          <Text style={styles.marketingLinkText}>View Marketing Results</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statusValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  processingText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonSecondaryText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  enhancedCount: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  emptyPhotos: {
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  enhancedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  enhancedBadgeText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: '600',
  },
  marketingLink: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  marketingLinkText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  backLink: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
