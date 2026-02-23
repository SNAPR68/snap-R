/**
 * Listings Stack Navigator
 * ListingsList → ListingDetail → MarketingResults
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListingsScreen from '../screens/listings/ListingsScreen';
import ListingDetailScreen from '../screens/listings/ListingDetailScreen';
import MarketingResultsScreen from '../screens/listings/MarketingResultsScreen';
import { colors } from '../constants/theme';

export type ListingsStackParamList = {
  ListingsList: undefined;
  ListingDetail: { listingId: string };
  MarketingResults: { listingId: string };
};

const Stack = createNativeStackNavigator<ListingsStackParamList>();

export default function ListingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ListingsList"
        component={ListingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: 'Listing' }}
      />
      <Stack.Screen
        name="MarketingResults"
        component={MarketingResultsScreen}
        options={{ title: 'Marketing' }}
      />
    </Stack.Navigator>
  );
}
