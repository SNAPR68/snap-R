/**
 * Settings Screen
 * Account, subscription, social connections, notifications
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export default function SettingsScreen() {
  const { profile, signOut, user } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

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
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Social Connections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Connections</Text>
        <View style={styles.card}>
          <SocialRow platform="Facebook" connected={false} />
          <SocialRow platform="Instagram" connected={false} />
          <SocialRow platform="LinkedIn" connected={false} />
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

function SocialRow({ platform, connected }: { platform: string; connected: boolean }) {
  return (
    <View style={styles.socialRow}>
      <Text style={styles.rowLabel}>{platform}</Text>
      <View style={[styles.statusDot, connected ? styles.connected : styles.disconnected]} />
      <Text style={[styles.statusText, connected ? styles.connectedText : styles.disconnectedText]}>
        {connected ? 'Connected' : 'Not connected'}
      </Text>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
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
    color: colors.textMuted,
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
