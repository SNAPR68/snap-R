/**
 * AI Director Camera Screen
 * Core feature: AI-guided real estate photography
 * Placeholder for Phase 2 implementation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function AiDirectorScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.cameraIcon}>
          <Text style={styles.iconText}>AI</Text>
        </View>
        <Text style={styles.title}>AI Photography Director</Text>
        <Text style={styles.subtitle}>
          Your personal AI photographer that guides you through capturing
          professional real estate photos
        </Text>

        <View style={styles.featureList}>
          <FeatureItem label="Room Detection" desc="Identifies room types automatically" />
          <FeatureItem label="Composition Guide" desc="Rule of thirds and framing overlay" />
          <FeatureItem label="Quality Score" desc="Real-time photo quality rating" />
          <FeatureItem label="Voice Coaching" desc="AI tells you how to position the camera" />
          <FeatureItem label="Photo Checklist" desc="Tracks which rooms you've captured" />
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Coming in Phase 2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ label, desc }: { label: string; desc: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureDot} />
      <View style={styles.featureContent}>
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  cameraIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  iconText: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.gold,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  featureList: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
