/**
 * Capture Review Screen
 * Shows captured photo with AI score, room type, and options to keep/retake
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import type { CapturedPhoto } from '../../types/shared';
import { PHOTO_TYPE_LABELS } from '../../lib/ai-director/checklist';
import ScoreRing from '../../components/camera/ScoreRing';

interface CaptureReviewScreenProps {
  route?: {
    params?: {
      photo?: CapturedPhoto;
      listingId?: string;
    };
  };
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function CaptureReviewScreen({ route, navigation }: CaptureReviewScreenProps) {
  const photo = route?.params?.photo;

  if (!photo) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No photo to review</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation?.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roomLabel = PHOTO_TYPE_LABELS[photo.roomType];
  const isLowScore = photo.score < 60;

  const handleKeep = () => {
    // Photo is already saved in capturedPhotos state via AiDirectorScreen
    // Navigate back to camera for next shot
    navigation?.goBack();
  };

  const handleRetake = () => {
    // Go back to camera without saving this photo
    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Photo preview */}
      <Image source={{ uri: photo.localUri }} style={styles.preview} resizeMode="contain" alt={`Captured ${roomLabel} photo`} />

      {/* Overlay info */}
      <View style={styles.infoOverlay}>
        {/* Room type badge */}
        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeText}>{roomLabel}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreWrapper}>
          <ScoreRing score={photo.score} size={90} />
        </View>

        {/* Low score warning */}
        {isLowScore && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Score is below 60. Consider retaking for a better result.
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.retakeButton]}
          onPress={handleRetake}
        >
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.keepButton]}
          onPress={handleKeep}
        >
          <Text style={styles.keepButtonText}>Keep Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
  },
  infoOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.lg,
  },
  roomBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  roomBadgeText: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreWrapper: {
    marginTop: spacing.md,
  },
  warningBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  keepButton: {
    backgroundColor: colors.gold,
  },
  keepButtonText: {
    color: colors.background,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  button: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
});
