/**
 * SnapR Mobile Theme Constants
 * Matches the web app dark theme + gold accent
 */

export const colors = {
  // Backgrounds (dark theme)
  background: '#0A0A0A',
  surface: '#0F0F0F',
  surfaceElevated: '#1A1A1A',
  surfaceSubtle: 'rgba(255, 255, 255, 0.05)',

  // Accent
  gold: '#D4A017',
  goldLight: '#E8C547',
  goldDark: '#B8860B',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  // Status
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#3B82F6',

  // Status badges
  prepared: '#22C55E',
  preparing: '#3B82F6',
  needsReview: '#EAB308',
  failed: '#EF4444',
  pending: '#666666',
  marketed: '#A855F7',
  marketing: '#F59E0B',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 34,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;
