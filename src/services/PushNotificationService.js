import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { API_BASE_URL } from '../utils/config';

// Backend API Base URL
// In a real app, import this from your config or env file
const API_URL = API_BASE_URL;

class PushNotificationService {
  /**
   * Request permission for push notifications
   */
  async requestUserPermission() {
    if (!Device.isDevice && Platform.OS === 'ios') {
      console.log('Must use physical device for Push Notifications on iOS');
      return false;
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
    return enabled;
  }

  /**
   * Get FCM token and save to backend
   */
  async getFCMToken(userToken) {
    try {
      if (!Device.isDevice && Platform.OS === 'ios') return null;

      // Get the token
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
        
        // Send to backend if authenticated
        if (userToken) {
          await this.registerTokenWithBackend(fcmToken, userToken);
        }
        
        return fcmToken;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
    return null;
  }

  /**
   * Register token with the backend
   */
  async registerTokenWithBackend(fcmToken, authHeaderToken) {
    try {
      const response = await fetch(`${API_URL}/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authHeaderToken}`,
        },
        body: JSON.stringify({ token: fcmToken }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to register FCM token');
      }
    } catch (error) {
      console.error('API Error (register FCM):', error);
    }
  }

  /**
   * Remove token from backend (e.g. on logout)
   */
  async removeTokenFromBackend(authHeaderToken) {
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      if (fcmToken && authHeaderToken) {
        await fetch(`${API_URL}/users/fcm-token`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authHeaderToken}`,
          },
          body: JSON.stringify({ token: fcmToken }),
        });
      }
      await AsyncStorage.removeItem('fcmToken');
    } catch (error) {
      console.error('API Error (remove FCM):', error);
    }
  }

  /**
   * Listen for token refresh
   */
  onTokenRefresh(authHeaderToken) {
    return messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      await AsyncStorage.setItem('fcmToken', newToken);
      if (authHeaderToken) {
        await this.registerTokenWithBackend(newToken, authHeaderToken);
      }
    });
  }

  /**
   * Setup foreground notification handler
   */
  setupForegroundHandler() {
    return messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived in the foreground!', JSON.stringify(remoteMessage));
      
      // If we're in the foreground, we typically show an alert or a custom toast
      Alert.alert(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || 'You have a new message.'
      );
    });
  }

  /**
   * Setup background/quit state handlers
   * Note: setBackgroundMessageHandler must be called at the root of your index.js/App.js
   */
  setupBackgroundHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
      // Optional: Update badge count or store message in local DB
    });
  }
}

export default new PushNotificationService();
