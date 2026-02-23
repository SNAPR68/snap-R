/**
 * Composition Grid Overlay
 * Rule-of-thirds grid drawn over the camera preview
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CompositionGridProps {
  visible?: boolean;
}

export default function CompositionGrid({ visible = true }: CompositionGridProps) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Vertical lines (rule of thirds) */}
      <View style={[styles.line, styles.verticalLine, { left: '33.33%' }]} />
      <View style={[styles.line, styles.verticalLine, { left: '66.66%' }]} />

      {/* Horizontal lines (rule of thirds) */}
      <View style={[styles.line, styles.horizontalLine, { top: '33.33%' }]} />
      <View style={[styles.line, styles.horizontalLine, { top: '66.66%' }]} />

      {/* Center crosshair */}
      <View style={styles.centerDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  verticalLine: {
    width: 1,
    top: 0,
    bottom: 0,
  },
  horizontalLine: {
    height: 1,
    left: 0,
    right: 0,
  },
  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginLeft: -3,
    marginTop: -3,
  },
});
