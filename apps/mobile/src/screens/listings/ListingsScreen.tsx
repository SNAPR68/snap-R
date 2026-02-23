/**
 * Listings Screen
 * List view of all user listings with status badges, search, and filter.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

interface ListingItem {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  preparation_status: string | null;
  marketing_status: string | null;
  photo_count: number;
  created_at: string;
}

const STATUS_FILTERS = ['All', 'Pending', 'Preparing', 'Prepared', 'Marketing', 'Marketed', 'Failed'] as const;

interface ListingsScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function ListingsScreen({ navigation }: ListingsScreenProps) {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const fetchListings = useCallback(async () => {
    try {
      const data = await apiClient.getAllListings();
      setListings(data);
    } catch {
      // Keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    let result = listings;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        l =>
          l.title.toLowerCase().includes(q) ||
          (l.address?.toLowerCase().includes(q) ?? false)
      );
    }

    if (statusFilter !== 'All') {
      const filterValue = statusFilter.toLowerCase();
      result = result.filter(
        l => (l.preparation_status ?? 'pending') === filterValue
      );
    }

    return result;
  }, [listings, search, statusFilter]);

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

  const getStatusLabel = (item: ListingItem): string => {
    if (item.marketing_status === 'completed') return 'Marketed';
    if (item.marketing_status === 'processing') return 'Marketing';
    return item.preparation_status ?? 'Pending';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={STATUS_FILTERS as unknown as string[]}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === item && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(item)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === item && styles.filterChipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Count */}
      <Text style={styles.countText}>
        Showing {filteredListings.length} of {listings.length} listings
      </Text>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search || statusFilter !== 'All'
                ? 'No matching listings'
                : 'No listings yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listingCard}
            onPress={() =>
              navigation.navigate('ListingDetail', { listingId: item.id })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(item.preparation_status)}20` },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(item.preparation_status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.preparation_status) },
                  ]}
                >
                  {getStatusLabel(item)}
                </Text>
              </View>
            </View>
            {item.address && (
              <Text style={styles.listingAddress} numberOfLines={1}>
                {item.address}
                {item.city ? `, ${item.city}` : ''}
                {item.state ? `, ${item.state}` : ''}
              </Text>
            )}
            <Text style={styles.photoCount}>{item.photo_count} photos</Text>
          </TouchableOpacity>
        )}
      />
    </View>
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderColor: colors.gold,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.gold,
  },
  countText: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  listingTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  listingAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  photoCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});
