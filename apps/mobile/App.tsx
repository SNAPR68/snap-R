/**
 * SnapR Mobile App - Entry Point
 * AI Photography Director for Real Estate
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import {
  registerForPushNotifications,
  registerDeviceToken,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './src/lib/notifications';
import type { EventSubscription } from 'expo-notifications';

/** Inner component that has access to auth context for push notification registration */
function AppContent() {
  const { isAuthenticated } = useAuth();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register for push notifications after login
    registerForPushNotifications().then(token => {
      if (token) {
        registerDeviceToken(token).catch(() => {
          // Registration failed silently — will retry on next launch
        });
      }
    }).catch(() => {
      // Push notification registration not available
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('[Notification] Received:', notification.request.content.title);
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      console.log('[Notification] Tapped:', data);
      // Future: deep-link to listing/content based on data.type
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
