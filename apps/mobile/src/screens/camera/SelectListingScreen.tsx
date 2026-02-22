/**
 * Select Listing Screen
 * Pick or create a listing before starting an AI Director capture session
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import type { PropertyType } from '../../types/shared';

interface ListingItem {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

interface SelectListingScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
];

export default function SelectListingScreen({ navigation }: SelectListingScreenProps) {
  const { session } = useAuth();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('house');
  const [creating, setCreating] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await apiClient.getListings();
      setListings(data ?? []);
    } catch {
      // Silently handle — empty list shown
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSelectListing = (listing: ListingItem) => {
    navigation.navigate('AiDirector', {
      listingId: listing.id,
      propertyType,
    });
  };

  const handleCreateListing = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a listing title.');
      return;
    }
    if (!session?.access_token) return;

    setCreating(true);
    try {
      const data = await apiClient.createListing({
        title: newTitle.trim(),
        address: newAddress.trim() || undefined,
      });
      if (data?.id) {
        navigation.navigate('AiDirector', {
          listingId: data.id,
          propertyType,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create listing';
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Listing</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Text style={styles.createText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Property type selector */}
      <View style={styles.propertyTypeRow}>
        {PROPERTY_TYPES.map(pt => (
          <TouchableOpacity
            key={pt.value}
            style={[
              styles.propertyTypeChip,
              propertyType === pt.value && styles.propertyTypeChipActive,
            ]}
            onPress={() => setPropertyType(pt.value)}
          >
            <Text
              style={[
                styles.propertyTypeText,
                propertyType === pt.value && styles.propertyTypeTextActive,
              ]}
            >
              {pt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create new listing form */}
      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.input}
            placeholder="Listing title (e.g. 123 Main St)"
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Address (optional)"
            placeholderTextColor={colors.textMuted}
            value={newAddress}
            onChangeText={setNewAddress}
          />
          <TouchableOpacity
            style={[styles.createButton, creating && styles.createButtonDisabled]}
            onPress={handleCreateListing}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.createButtonText}>Create & Start Capture</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Existing listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No listings yet</Text>
              <Text style={styles.emptySubtext}>
                Create a new listing above to get started
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listingCard}
              onPress={() => handleSelectListing(item)}
            >
              <Text style={styles.listingTitle}>{item.title}</Text>
              {item.address && (
                <Text style={styles.listingAddress}>
                  {item.address}{item.city ? `, ${item.city}` : ''}{item.state ? `, ${item.state}` : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.md,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  createText: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  propertyTypeRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  propertyTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  propertyTypeChipActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderColor: colors.gold,
  },
  propertyTypeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  propertyTypeTextActive: {
    color: colors.gold,
  },
  createForm: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  createButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  listingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  listingAddress: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
