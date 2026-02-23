/**
 * AI Director Camera Screen
 * Core feature: Real-time AI-guided real estate photography.
 *
 * Uses expo-camera for preview, on-device scoring for composition/lighting,
 * and voice coaching via expo-speech.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import type { PhotoType, RoomChecklistItem, CapturedPhoto } from '../../types/shared';
import { scoreComposition, getCompositionTips } from '../../lib/ai-director/composition-scorer';
import { assessLighting } from '../../lib/ai-director/lighting-analyzer';
import {
  speak,
  setVoiceEnabled,
  getScoreCoaching,
  getCaptureConfirmation,
  getRoomTransitionCoaching,
  stopSpeaking,
} from '../../lib/ai-director/voice-coach';
import {
  createChecklist,
  markRoomCaptured,
  getNextSuggestedRoom,
  getChecklistProgress,
  PHOTO_TYPE_LABELS,
} from '../../lib/ai-director/checklist';
import CompositionGrid from '../../components/camera/CompositionGrid';
import ScoreRing from '../../components/camera/ScoreRing';
import GuidanceOverlay from '../../components/camera/GuidanceOverlay';
import RoomBadge from '../../components/camera/RoomBadge';
import PhotoChecklist from '../../components/camera/PhotoChecklist';
import { useBillingGate } from '../../hooks/useBillingGate';

interface AiDirectorScreenProps {
  route?: {
    params?: {
      listingId?: string;
      propertyType?: string;
    };
  };
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export default function AiDirectorScreen({ route, navigation }: AiDirectorScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { canUseDirector, upgradeMessage } = useBillingGate();

  // AI Director state
  const [detectedRoom, setDetectedRoom] = useState<PhotoType>('exterior_front');
  // setDetectedRoom is used in the scoring interval below to simulate room detection
  void setDetectedRoom;
  const [overallScore, setOverallScore] = useState(0);
  const [tips, setTips] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Checklist state
  const propertyType = (route?.params?.propertyType as 'house' | 'apartment' | 'condo' | 'townhouse' | 'commercial') ?? 'house';
  const [checklist, setChecklist] = useState<RoomChecklistItem[]>(() =>
    createChecklist(propertyType)
  );

  // Simulated scoring interval (in production, this reads from sensors + ML model)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate on-device composition scoring
      const compositionResult = scoreComposition(
        { width: 1920, height: 1080 },
        true, // landscape
        Math.random() * 3 // simulated tilt
      );

      // Simulate lighting assessment
      const lightingResult = assessLighting(
        200 + Math.random() * 300, // simulated lux
        detectedRoom.startsWith('exterior')
      );

      // Combine scores
      const combined = Math.round(
        compositionResult.overall * 0.5 + lightingResult.score * 0.5
      );
      setOverallScore(combined);

      // Generate tips
      const compositionTips = getCompositionTips(compositionResult, true);
      const allTips = [...compositionTips, ...lightingResult.tips].slice(0, 3);
      setTips(allTips);
    }, 2000);

    return () => clearInterval(interval);
  }, [detectedRoom]);

  // Voice coaching for score changes — only speak when crossing the 80 threshold
  const scoreAboveThreshold = overallScore >= 80;
  useEffect(() => {
    if (voiceEnabled && overallScore > 0) {
      const coaching = getScoreCoaching(overallScore);
      speak(coaching);
    }
  }, [scoreAboveThreshold, voiceEnabled, overallScore]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        exif: true,
      });

      if (!photo) {
        setIsCapturing(false);
        return;
      }

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Create captured photo record
      const captured: CapturedPhoto = {
        localUri: photo.uri,
        roomType: detectedRoom,
        score: overallScore,
        timestamp: new Date().toISOString(),
        width: photo.width,
        height: photo.height,
        exif: photo.exif as Record<string, unknown> | undefined,
      };

      setCapturedPhotos(prev => [...prev, captured]);

      // Update checklist
      const photoId = `local-${Date.now()}`;
      const updatedChecklist = markRoomCaptured(checklist, detectedRoom, photoId, overallScore);
      setChecklist(updatedChecklist);

      // Voice confirmation
      if (voiceEnabled) {
        const label = PHOTO_TYPE_LABELS[detectedRoom];
        speak(getCaptureConfirmation(label, overallScore), 'high');

        // Suggest next room
        const next = getNextSuggestedRoom(updatedChecklist);
        if (next) {
          setTimeout(() => {
            speak(getRoomTransitionCoaching(next.label));
          }, 2000);
        }
      }

      // Navigate to review
      navigation?.navigate('CaptureReview', {
        photo: captured,
        listingId: route?.params?.listingId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to capture photo';
      Alert.alert('Capture Failed', message);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, detectedRoom, overallScore, checklist, voiceEnabled, navigation, route]);

  const toggleVoice = useCallback(() => {
    const newState = !voiceEnabled;
    setVoiceEnabledState(newState);
    setVoiceEnabled(newState);
    if (!newState) stopSpeaking();
  }, [voiceEnabled]);

  // Permission screen
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          The AI Photography Director needs camera access to guide you through capturing professional real estate photos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Billing gate: block free/starter users from AI Director
  if (!canUseDirector) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>AI Director</Text>
        <Text style={styles.permissionText}>{upgradeMessage}</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getChecklistProgress(checklist);
  const nextRoom = getNextSuggestedRoom(checklist);

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashEnabled ? 'on' : 'off'}
      >
        {/* Composition Grid */}
        <CompositionGrid visible={showGrid} />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.topButtonText}>✕</Text>
          </TouchableOpacity>

          <RoomBadge roomType={detectedRoom} />

          <View style={styles.topActions}>
            <TouchableOpacity
              style={[styles.topButton, flashEnabled && styles.topButtonActive]}
              onPress={() => setFlashEnabled(!flashEnabled)}
            >
              <Text style={styles.topButtonText}>⚡</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.topButton, showGrid && styles.topButtonActive]}
              onPress={() => setShowGrid(!showGrid)}
            >
              <Text style={styles.topButtonText}>▦</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Ring (top right) */}
        <View style={styles.scoreContainer}>
          <ScoreRing score={overallScore} size={70} />
        </View>

        {/* Guidance Tips */}
        <GuidanceOverlay tips={tips} />

        {/* Photo Checklist Panel */}
        <PhotoChecklist
          checklist={checklist}
          visible={showChecklist}
          onClose={() => setShowChecklist(false)}
        />

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          {/* Next room suggestion */}
          {nextRoom && (
            <Text style={styles.nextRoomText}>
              Next: {nextRoom.label}
            </Text>
          )}

          <View style={styles.controlsRow}>
            {/* Voice toggle */}
            <TouchableOpacity
              style={[styles.sideButton, voiceEnabled && styles.sideButtonActive]}
              onPress={toggleVoice}
            >
              <Text style={styles.sideButtonText}>
                {voiceEnabled ? '🔊' : '🔇'}
              </Text>
            </TouchableOpacity>

            {/* Capture button */}
            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isCapturing}
              activeOpacity={0.7}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Checklist toggle */}
            <TouchableOpacity
              style={[styles.sideButton, showChecklist && styles.sideButtonActive]}
              onPress={() => setShowChecklist(!showChecklist)}
            >
              <Text style={styles.sideButtonText}>
                {progress.captured}/{progress.total}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Captured count */}
          <Text style={styles.capturedCount}>
            {capturedPhotos.length} photo{capturedPhotos.length !== 1 ? 's' : ''} captured
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  permissionButton: {
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  permissionButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.background,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topButtonActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.4)',
  },
  topButtonText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Score
  scoreContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: spacing.lg,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  nextRoomText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginBottom: spacing.md,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.4)',
  },
  sideButtonText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  capturedCount: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
