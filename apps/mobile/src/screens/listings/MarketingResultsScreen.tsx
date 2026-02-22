/**
 * Marketing Results Screen
 * Shows all 5 marketing artifacts for a listing.
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
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { apiClient } from '../../lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

interface MarketingData {
  description: string | null;
  captions: Record<string, string> | null;
  mls_summary: string | null;
  property_site_url: string | null;
  scheduled_posts_count: number;
}

interface MarketingResultsScreenProps {
  route: {
    params: { listingId: string };
  };
}

export default function MarketingResultsScreen({
  route,
}: MarketingResultsScreenProps) {
  const { listingId } = route.params;
  const [data, setData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await apiClient.getMarketingResults(listingId);
      if (result) setData(result);
    } catch {
      // Keep stale data
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleCopy = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>No marketing results yet</Text>
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
      <Text style={styles.pageTitle}>Marketing Results</Text>

      {/* Property Description */}
      {data.description && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Property Description</Text>
            <TouchableOpacity
              onPress={() => handleCopy(data.description ?? '', 'description')}
            >
              <Text style={styles.copyButton}>
                {copiedField === 'description' ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardContent} numberOfLines={8}>
            {data.description}
          </Text>
        </View>
      )}

      {/* Social Captions */}
      {data.captions && Object.keys(data.captions).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Social Captions</Text>
          {Object.entries(data.captions).map(([platform, caption]) => (
            <View key={platform} style={styles.captionItem}>
              <View style={styles.captionHeader}>
                <Text style={styles.platformLabel}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCopy(caption, `caption-${platform}`)}
                >
                  <Text style={styles.copyButton}>
                    {copiedField === `caption-${platform}` ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.captionText} numberOfLines={4}>
                {caption}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* MLS Summary */}
      {data.mls_summary && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MLS Package</Text>
            <TouchableOpacity
              onPress={() => handleCopy(data.mls_summary ?? '', 'mls')}
            >
              <Text style={styles.copyButton}>
                {copiedField === 'mls' ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardContent} numberOfLines={6}>
            {data.mls_summary}
          </Text>
        </View>
      )}

      {/* Property Site */}
      {data.property_site_url && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Property Site</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL(data.property_site_url ?? '')}
          >
            <Text style={styles.linkButtonText}>Open Property Site</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scheduled Posts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scheduled Posts</Text>
        <Text style={styles.cardContent}>
          {data.scheduled_posts_count} posts scheduled for auto-publishing
        </Text>
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
  pageTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardContent: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  copyButton: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  captionItem: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  platformLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  captionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  linkButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  linkButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});
