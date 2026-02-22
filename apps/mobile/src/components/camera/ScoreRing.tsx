/**
 * Score Ring
 * Circular score indicator showing real-time photo quality (0-100).
 * Green (80+), Yellow (50-79), Red (<50)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../constants/theme';

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.error;
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Capture now!';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Improve';
  return 'Reposition';
}

export default function ScoreRing({ score, size = 80, label }: ScoreRingProps) {
  const scoreColor = getScoreColor(score);
  const borderWidth = size * 0.06;
  const innerSize = size - borderWidth * 2;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: scoreColor,
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Text style={[styles.score, { color: scoreColor, fontSize: size * 0.3 }]}>
            {score}
          </Text>
        </View>
      </View>
      <Text style={[styles.label, { color: scoreColor }]}>
        {label ?? getScoreLabel(score)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontWeight: '700',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
