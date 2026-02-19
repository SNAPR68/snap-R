/**
 * Content Studio Screen
 * Hub for marketing content, calendar, and analytics
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function ContentStudioScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Content Studio</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scheduled Posts</Text>
        <Text style={styles.cardDesc}>
          View and manage your upcoming social media posts
        </Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No scheduled posts</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analytics</Text>
        <Text style={styles.cardDesc}>
          Track engagement across your published posts
        </Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calendar</Text>
        <Text style={styles.cardDesc}>
          Visual schedule of all your content
        </Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
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
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  emptyState: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
