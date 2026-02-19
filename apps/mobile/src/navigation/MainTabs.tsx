/**
 * Main Tab Navigator
 * Bottom tabs for authenticated users: Dashboard, Camera, Listings, Content, Settings
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AiDirectorScreen from '../screens/camera/AiDirectorScreen';
import ListingsScreen from '../screens/listings/ListingsScreen';
import ContentStudioScreen from '../screens/content/ContentStudioScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { colors, fontSize } from '../constants/theme';

export type MainTabsParamList = {
  Dashboard: undefined;
  Camera: undefined;
  Listings: undefined;
  Content: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.textPrimary,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'SnapR',
          headerTitleStyle: [styles.headerTitle, styles.logoTitle],
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Camera"
        component={AiDirectorScreen}
        options={{
          title: 'AI Director',
          tabBarLabel: 'Capture',
        }}
      />
      <Tab.Screen
        name="Listings"
        component={ListingsScreen}
        options={{
          title: 'Listings',
        }}
      />
      <Tab.Screen
        name="Content"
        component={ContentStudioScreen}
        options={{
          title: 'Content',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    shadowColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  logoTitle: {
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    paddingTop: 4,
    height: 85,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
