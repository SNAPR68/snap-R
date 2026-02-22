/**
 * Room Badge
 * Shows the detected room type as a badge over the camera preview
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import type { PhotoType } from '../../types/shared';
import { PHOTO_TYPE_LABELS } from '../../lib/ai-director/checklist';

interface RoomBadgeProps {
  roomType: PhotoType;
  confidence?: number;
}

export default function RoomBadge({ roomType, confidence }: RoomBadgeProps) {
  if (roomType === 'unknown') return null;

  const label = PHOTO_TYPE_LABELS[roomType];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {confidence !== undefined && confidence > 0 && (
        <Text style={styles.confidence}>{confidence}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  label: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidence: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
