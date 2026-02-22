/**
 * Guidance Overlay
 * Displays real-time tips and coaching text over the camera preview
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

interface GuidanceOverlayProps {
  tips: string[];
  visible?: boolean;
}

export default function GuidanceOverlay({ tips, visible = true }: GuidanceOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && tips.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, tips, fadeAnim]);

  if (!visible || tips.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {tips.map((tip, index) => (
        <View key={`${tip}-${index}`} style={styles.tipRow}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  tipText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
  },
});
