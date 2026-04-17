import { DEFAULT_PREFERENCES, type NotificationPreferences } from './types';

export type NotificationPreferencesRecord = Record<string, unknown>;

export function mergeNotificationPreferences(
  current: NotificationPreferencesRecord | null | undefined,
  updates: NotificationPreferencesRecord | null | undefined
): NotificationPreferencesRecord {
  return {
    ...(current ?? {}),
    ...(updates ?? {}),
  };
}

export function buildNotificationPreferences(
  current: NotificationPreferencesRecord | null | undefined,
  overrides: Partial<NotificationPreferences> = {}
): NotificationPreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...current,
    ...overrides,
  };
}

export function getNotificationTimezone(
  preferences: NotificationPreferencesRecord | NotificationPreferences | null | undefined
): string {
  const value = preferences?.notificationTimezone;
  return typeof value === 'string' && value.trim().length > 0 ? value : 'UTC';
}
