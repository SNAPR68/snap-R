/**
 * AI Director - Voice Coach
 * Text-to-speech guidance using expo-speech
 */

import * as Speech from 'expo-speech';

let isEnabled = true;
let isSpeaking = false;
let speechQueue: string[] = [];

/** Enable or disable voice coaching */
export function setVoiceEnabled(enabled: boolean): void {
  isEnabled = enabled;
  if (!enabled) {
    Speech.stop();
    speechQueue = [];
    isSpeaking = false;
  }
}

/** Check if voice coaching is enabled */
export function isVoiceEnabled(): boolean {
  return isEnabled;
}

/** Speak a guidance message. High priority interrupts current speech. */
export function speak(message: string, priority: 'normal' | 'high' = 'normal'): void {
  if (!isEnabled) return;

  if (priority === 'high') {
    Speech.stop();
    speechQueue = [];
    isSpeaking = false;
    speakNow(message);
  } else if (isSpeaking) {
    if (speechQueue.length < 3) {
      speechQueue.push(message);
    }
  } else {
    speakNow(message);
  }
}

function speakNow(message: string): void {
  isSpeaking = true;
  Speech.speak(message, {
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    onDone: () => {
      isSpeaking = false;
      processQueue();
    },
    onError: () => {
      isSpeaking = false;
      processQueue();
    },
  });
}

function processQueue(): void {
  if (speechQueue.length > 0 && isEnabled) {
    const next = speechQueue.shift();
    if (next) speakNow(next);
  }
}

/** Stop all speech immediately */
export function stopSpeaking(): void {
  Speech.stop();
  speechQueue = [];
  isSpeaking = false;
}

/** Generate coaching message based on score */
export function getScoreCoaching(score: number): string {
  if (score >= 85) return 'Great shot! Capture now.';
  if (score >= 70) return 'Good angle. Hold steady.';
  if (score >= 50) return 'Almost there. Check the tips.';
  return 'Try a different position.';
}

/** Generate room transition coaching */
export function getRoomTransitionCoaching(nextRoom: string): string {
  return `Nice work. Now let's photograph the ${nextRoom}.`;
}

/** Generate capture confirmation */
export function getCaptureConfirmation(roomLabel: string, score: number): string {
  if (score >= 80) return `Great ${roomLabel} photo captured!`;
  if (score >= 60) return `${roomLabel} captured. You can retake for a better score.`;
  return `${roomLabel} captured, but the score is low. Consider retaking.`;
}
