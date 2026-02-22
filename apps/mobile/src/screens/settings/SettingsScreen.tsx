/**
 * Settings Screen
 * Account, subscription, social connections, notifications.
 * Fetches real social connection status from API.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { API_BASE_URL } from '../../constants/config';

interface SocialConnectionStatus {
  platform: string;
  connected: boolean;
  displayName?: string;
}

export default function SettingsScreen() {
  const { profile, signOut, user } = useAuth();
  const [connections, setConnections] = useState<SocialConnectionStatus[]>([
    { platform: 'Facebook', connected: false },
    { platform: 'Instagram', connected: false },
    { platform: 'LinkedIn', connected: false },
    { platform: 'TikTok', connected: false },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await apiClient.getSocialConnections();
      if (data.length > 0) {
        const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok'];
        setConnections(
          platforms.map(p => {
            const conn = data.find(
              (c: { platform: string }) => c.platform.toLowerCase() === p.toLowerCase()
            );
            return {
              platform: p,
              connected: !!conn,
              displayName: conn?.display_name ?? undefined,
            };
          })
        );
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConnections();
    setRefreshing(false);
  }, [fetchConnections]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleManageSubscription = () => {
    Linking.openURL(`${API_BASE_URL}/dashboard/billing`);
  };

  const handleConnectPlatform = (platform: string) => {
    Linking.openURL(
      `${API_BASE_URL}/dashboard/settings?connect=${platform.toLowerCase()}`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.gold}
        />
      }
    >
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingsRow label="Name" value={profile?.full_name ?? 'Not set'} />
          <SettingsRow label="Email" value={user?.email ?? 'Unknown'} />
          <SettingsRow label="Company" value={profile?.company ?? 'Not set'} />
          <SettingsRow label="Role" value={profile?.role ?? 'Not set'} />
        </View>
      </View>

      {/* Subscription Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.card}>
          <View style={styles.tierRow}>
            <Text style={styles.tierLabel}>Current Plan</Text>
            <Text style={styles.tierValue}>
              {(profile?.subscription_tier ?? 'free').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleManageSubscription}
          >
            <Text style={styles.upgradeButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Social Connections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Connections</Text>
        <View style={styles.card}>
          {connections.map(conn => (
            <TouchableOpacity
              key={conn.platform}
              style={styles.socialRow}
              onPress={() =>
                !conn.connected && handleConnectPlatform(conn.platform)
              }
            >
              <Text style={styles.rowLabel}>{conn.platform}</Text>
              <View
                style={[
                  styles.statusDot,
                  conn.connected ? styles.connected : styles.disconnected,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  conn.connected ? styles.connectedText : styles.disconnectedText,
                ]}
              >
                {conn.connected
                  ? conn.displayName ?? 'Connected'
                  : 'Connect'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <SettingsRow label="Push Notifications" value="Coming soon" />
          <SettingsRow label="Email Digest" value="Coming soon" />
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SnapR Mobile v1.0.0</Text>
    </ScrollView>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tierLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  tierValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.gold,
  },
  upgradeButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeButtonText: {
    fontSize: fontSize.md,
    color: colors.gold,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  connected: {
    backgroundColor: colors.success,
  },
  disconnected: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontSize: fontSize.sm,
  },
  connectedText: {
    color: colors.success,
  },
  disconnectedText: {
    color: colors.gold,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: {
    fontSize: fontSize.lg,
    color: colors.error,
    fontWeight: '600',
  },
  version: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
