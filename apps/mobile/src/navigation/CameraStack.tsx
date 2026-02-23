/**
 * Camera Stack Navigator
 * SelectListing → AiDirector → CaptureReview
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SelectListingScreen from '../screens/camera/SelectListingScreen';
import AiDirectorScreen from '../screens/camera/AiDirectorScreen';
import CaptureReviewScreen from '../screens/camera/CaptureReviewScreen';

export type CameraStackParamList = {
  SelectListing: undefined;
  AiDirector: { listingId?: string; propertyType?: string };
  CaptureReview: { photo?: unknown; listingId?: string };
};

const Stack = createNativeStackNavigator<CameraStackParamList>();

export default function CameraStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SelectListing" component={SelectListingScreen} />
      <Stack.Screen name="AiDirector" component={AiDirectorScreen} />
      <Stack.Screen name="CaptureReview" component={CaptureReviewScreen} />
    </Stack.Navigator>
  );
}
