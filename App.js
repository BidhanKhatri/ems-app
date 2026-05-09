import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import messaging from '@react-native-firebase/messaging';
import RootNavigator from './src/navigation/RootNavigator';
import PushNotificationService from './src/services/PushNotificationService';
import Preloader from './src/components/Preloader';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Request Android 13+ Notification Permission
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }

        // Initialize Push Notifications
        const fetchToken = async () => {
          try {
            const token = await messaging().getToken();
            console.log('FCM Token (App.js):', token);
          } catch (error) {
            console.error('Error fetching FCM token in App.js:', error);
          }
        };
        await fetchToken();
        PushNotificationService.setupForegroundHandler();

        // Artificially delay for 1.5 seconds to show the professional preloader
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide the splash screen once the app is ready
      const hideSplash = async () => {
        // Small delay to ensure Preloader is rendered and prevent flicker
        setTimeout(async () => {
          await SplashScreen.hideAsync();
        }, 200);
      };
      hideSplash();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <Preloader />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}
