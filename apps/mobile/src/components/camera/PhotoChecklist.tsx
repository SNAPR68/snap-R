/**
 * Photo Checklist
 * Shows which rooms have been captured and which are still needed.
 * Slides in from the right side of the camera view.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import type { RoomChecklistItem } from '../../types/shared';
import { getChecklistProgress } from '../../lib/ai-director/checklist';

interface PhotoChecklistProps {
  checklist: RoomChecklistItem[];
  visible: boolean;
  onClose: () => void;
}

export default function PhotoChecklist({ checklist, visible, onClose }: PhotoChecklistProps) {
  if (!visible) return null;

  const progress = getChecklistProgress(checklist);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Checklist</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.captured} of {progress.total} captured
        </Text>
      </View>

      {/* Room list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {checklist.map((item, index) => (
          <View key={`${item.roomType}-${index}`} style={styles.item}>
            <View
              style={[
                styles.checkbox,
                item.captured ? styles.checkboxDone : styles.checkboxEmpty,
              ]}
            >
              {item.captured && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemLabel,
                  item.captured && styles.itemLabelDone,
                ]}
              >
                {item.label}
              </Text>
              {item.required && !item.captured && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
              {item.score !== undefined && (
                <Text style={styles.scoreBadge}>Score: {item.score}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {progress.allRequiredDone && (
        <View style={styles.doneMessage}>
          <Text style={styles.doneText}>All required rooms captured!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 0,
    bottom: 120,
    width: 260,
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  closeText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  checkboxDone: {
    backgroundColor: colors.success,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    flex: 1,
  },
  itemLabelDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  requiredBadge: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  scoreBadge: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  doneMessage: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  doneText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
