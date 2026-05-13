import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, Alert, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import messaging from '@react-native-firebase/messaging';
import RootNavigator from './src/navigation/RootNavigator';
import PushNotificationService from './src/services/PushNotificationService';
import Preloader from './src/components/Preloader';
import useAuthStore from './src/store/useAuthStore';
import { COLORS } from './src/theme/theme';

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
      <LogoutLoader />
    </NavigationContainer>
  );
}

function LogoutLoader() {
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);

  if (!isLoggingOut) return null;

  return (
    <View style={styles.logoutOverlay}>
      <View style={styles.logoutCard}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.logoutText}>Signing out...</Text>
        <Text style={styles.logoutSubtext}>Please wait a moment</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoutCard: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoutText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  logoutSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
